// 로컬 스토리지에서 데이터 로드
let geckos = [];
let ddays = [];

// 데이터 로드 함수
function loadGeckos() {
    try {
        const savedGeckos = localStorage.getItem('geckos');
        if (savedGeckos) {
            geckos = JSON.parse(savedGeckos);
            console.log('데이터 로드 성공:', geckos.length, '개의 개체');
        }
    } catch (error) {
        console.error('데이터 로드 중 오류 발생:', error);
        geckos = [];
    }
}

// 데이터 저장 함수
function saveGeckos() {
    try {
        // 데이터 유효성 검사
        const validGeckos = geckos.map(gecko => ({
            ...gecko,
            name: gecko.name || '이름 없음',
            hatchDate: gecko.hatchDate || '',
            photos: gecko.photos || [],
            fatherName: gecko.fatherName || '',
            fatherPhotos: gecko.fatherPhotos || [],
            motherName: gecko.motherName || '',
            motherPhotos: gecko.motherPhotos || [],
            weightHistory: gecko.weightHistory || [],
            lastModified: new Date().toISOString()
        }));

        // localStorage 용량 제한 확인
        const dataString = JSON.stringify(validGeckos);
        if (dataString.length > 4.5 * 1024 * 1024) { // 4.5MB 제한
            throw new Error('저장할 데이터가 너무 큽니다. 일부 사진을 삭제해주세요.');
        }

        localStorage.setItem('geckos', dataString);
        console.log('데이터 저장 성공:', validGeckos.length, '개의 개체');
    } catch (error) {
        console.error('데이터 저장 중 오류 발생:', error);
        alert('데이터 저장 중 오류가 발생했습니다: ' + error.message);
    }
}

// 이미지 압축 함수
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                const MAX_SIZE = 800;
                if (width > height && width > MAX_SIZE) {
                    height = Math.round((height * MAX_SIZE) / width);
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = Math.round((width * MAX_SIZE) / height);
                    height = MAX_SIZE;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 이미지 프리뷰 설정
function setupImagePreview(inputId, previewId, isMultiple = false) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('change', async function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            try {
                if (isMultiple) {
                    preview.innerHTML = '';
                    for (let file of files) {
                        const compressedImage = await compressImage(file);
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'preview-item';
                        imgContainer.innerHTML = `<img src="${compressedImage}" alt="Preview">`;
                        preview.appendChild(imgContainer);
                    }
                } else {
                    const compressedImage = await compressImage(files[0]);
                    preview.innerHTML = `<img src="${compressedImage}" alt="Preview">`;
                }
            } catch (error) {
                console.error('이미지 처리 중 오류 발생:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
            }
        }
    });
}

// 이미지 프리뷰 설정
setupImagePreview('photos', 'photoPreview', true);
setupImagePreview('fatherPhotos', 'fatherPhotoPreview', true);
setupImagePreview('motherPhotos', 'motherPhotoPreview', true);

// 새 개체 추가 폼 토글 기능
const toggleAddForm = document.getElementById('toggleAddForm');
const addGeckoForm = document.getElementById('addGeckoForm');
const cancelAdd = document.getElementById('cancelAdd');

toggleAddForm.addEventListener('click', () => {
    addGeckoForm.style.display = addGeckoForm.style.display === 'none' ? 'block' : 'none';
    if (addGeckoForm.style.display === 'block') {
        addGeckoForm.scrollIntoView({ behavior: 'smooth' });
    }
});

cancelAdd.addEventListener('click', () => {
    addGeckoForm.style.display = 'none';
    geckoForm.reset();
    clearPhotoPreviews();
});

// 폼 제출 처리
document.getElementById('geckoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const photoPreviews = document.querySelectorAll('#photoPreview img');
        const fatherPhotoPreviews = document.querySelectorAll('#fatherPhotoPreview img');
        const motherPhotoPreviews = document.querySelectorAll('#motherPhotoPreview img');
        
        // 필수 입력값 검사
        const name = document.getElementById('name').value;
        if (!name.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }

        const gecko = {
            id: Date.now(),
            name: name,
            hatchDate: document.getElementById('hatchDate').value || '',
            photos: Array.from(photoPreviews).map(img => img.src),
            fatherName: document.getElementById('fatherName').value || '',
            fatherPhotos: Array.from(fatherPhotoPreviews).map(img => img.src),
            motherName: document.getElementById('motherName').value || '',
            motherPhotos: Array.from(motherPhotoPreviews).map(img => img.src),
            weightHistory: document.getElementById('weight').value ? [{
                date: new Date().toISOString().split('T')[0],
                weight: parseFloat(document.getElementById('weight').value)
            }] : [],
            lastModified: new Date().toISOString()
        };
        
        geckos.push(gecko);
        saveGeckos();
        
        // 폼 제출 후 처리
        this.reset();
        clearPhotoPreviews();
        addGeckoForm.style.display = 'none';
        displayGeckos();
        
        // 스크롤을 목록 상단으로 이동
        document.querySelector('.gecko-list').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('개체 추가 중 오류 발생:', error);
        alert('개체 추가 중 오류가 발생했습니다: ' + error.message);
    }
});

// 무게 기록 추가
function addWeightEntry(geckoId) {
    const weight = prompt('새로운 무게를 입력하세요 (g):');
    if (weight === null) return;
    
    const gecko = geckos.find(g => g.id === geckoId);
    if (gecko) {
        gecko.weightHistory.push({
            date: new Date().toISOString().split('T')[0],
            weight: parseFloat(weight)
        });
        gecko.lastModified = new Date().toISOString();
        saveGeckos();
        displayGeckos();
    }
}

// 메시지 표시 함수
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // 3초 후 메시지 제거
    setTimeout(() => {
        messageDiv.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// 개체 정보 업데이트
async function updateGecko(event, geckoId) {
    event.preventDefault();
    const form = event.target;
    const gecko = geckos.find(g => g.id === geckoId);
    if (!gecko) return;
    
    try {
        // 기본 정보 업데이트
        gecko.name = form.name.value;
        gecko.hatchDate = form.hatchDate.value;
        
        // 새로운 무게 기록 추가
        const newWeight = parseFloat(form.weight.value);
        if (newWeight && newWeight !== gecko.weightHistory[gecko.weightHistory.length - 1]?.weight) {
            gecko.weightHistory.push({
                date: new Date().toISOString().split('T')[0],
                weight: newWeight
            });
        }
        
        // 새로운 사진 처리
        const newPhotos = form.newPhotos.files;
        if (newPhotos.length > 0) {
            for (let file of newPhotos) {
                const compressedImage = await compressImage(file);
                gecko.photos.push(compressedImage);
            }
        }
        
        // 새로운 부 사진 처리
        const newFatherPhotos = form.newFatherPhotos.files;
        if (newFatherPhotos.length > 0) {
            for (let file of newFatherPhotos) {
                const compressedImage = await compressImage(file);
                gecko.fatherPhotos.push(compressedImage);
            }
        }
        
        // 새로운 모 사진 처리
        const newMotherPhotos = form.newMotherPhotos.files;
        if (newMotherPhotos.length > 0) {
            for (let file of newMotherPhotos) {
                const compressedImage = await compressImage(file);
                gecko.motherPhotos.push(compressedImage);
            }
        }
        
        // 부모 정보 업데이트
        gecko.fatherName = form.fatherName.value;
        gecko.motherName = form.motherName.value;
        
        gecko.lastModified = new Date().toISOString();
        saveGeckos();
        displayGeckos();
        
        // 상세 정보 뷰 제거
        const detailsDiv = document.querySelector(`.gecko-details[data-gecko-id="${geckoId}"]`);
        if (detailsDiv) {
            detailsDiv.remove();
        }
        
        // 성공 메시지 표시
        showMessage('개체 정보가 성공적으로 저장되었습니다.');
        
    } catch (error) {
        console.error('개체 정보 업데이트 중 오류 발생:', error);
        showMessage('개체 정보 업데이트 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 개체 삭제
function deleteGecko(id) {
    if (confirm('정말로 이 개체를 삭제하시겠습니까?')) {
        try {
            const index = geckos.findIndex(g => g.id === id);
            if (index !== -1) {
                geckos.splice(index, 1);
                saveGeckos();
                displayGeckos();
                
                // 상세 정보 뷰 제거
                const detailsDiv = document.querySelector(`.gecko-details[data-gecko-id="${id}"]`);
                if (detailsDiv) {
                    detailsDiv.remove();
                }
                
                showMessage('개체가 성공적으로 삭제되었습니다.');
            }
        } catch (error) {
            console.error('개체 삭제 중 오류 발생:', error);
            showMessage('개체 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }
}

// 개체 수정
function editGecko(geckoId) {
    const gecko = geckos.find(g => g.id === geckoId);
    if (!gecko) return;

    const detailsDiv = document.querySelector(`[data-gecko-id="${geckoId}"] .gecko-details`);
    const isEditing = detailsDiv.classList.contains('edit-mode');

    if (isEditing) {
        // 수정 완료
        const name = detailsDiv.querySelector('.edit-name').value;
        const hatchDate = detailsDiv.querySelector('.edit-hatch-date').value;
        const fatherName = detailsDiv.querySelector('.edit-father-name').value;
        const motherName = detailsDiv.querySelector('.edit-mother-name').value;

        gecko.name = name || '이름 없음';
        gecko.hatchDate = hatchDate;
        gecko.fatherName = fatherName;
        gecko.motherName = motherName;
        gecko.lastModified = new Date().toISOString();

        saveGeckos();
        displayGeckos();
    } else {
        // 수정 모드로 전환
        detailsDiv.classList.add('edit-mode');
        const info = detailsDiv.querySelector('.gecko-info');
        info.innerHTML = `
            <button class="close-details" onclick="closeDetails(${geckoId})">✕</button>
            <div class="form-group">
                <label>📋 이름:</label>
                <input type="text" class="edit-name" value="${gecko.name}">
            </div>
            <div class="form-group">
                <label>📋 해칭일:</label>
                <input type="date" class="edit-hatch-date" value="${gecko.hatchDate}">
            </div>
            <div class="form-group">
                <label>📋 부: </label>
                <input type="text" class="edit-father-name" value="${gecko.fatherName}">
            </div>
            <div class="form-group">
                <label>📋 모: </label>
                <input type="text" class="edit-mother-name" value="${gecko.motherName}">
            </div>
            <div class="actions">
                <button onclick="editGecko(${geckoId})">📋 저장</button>
                <button onclick="deleteGecko(${geckoId})">📋 삭제</button>
            </div>
        `;
    }
}

// 상세 정보 닫기
function closeDetails(geckoId) {
    const detailsDiv = document.querySelector(`[data-gecko-id="${geckoId}"] .gecko-details`);
    detailsDiv.classList.remove('active', 'edit-mode');
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    if (!dateString) return '날짜 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 개체 목록 표시
function displayGeckos() {
    const geckoList = document.getElementById('geckoList');
    geckoList.innerHTML = '';
    
    if (geckos.length === 0) {
        geckoList.innerHTML = '<p class="empty-message">⬜ 등록된 개체가 없습니다.</p>';
        return;
    }
    
    // 최신 항목이 나중에 오도록 정렬
    const sortedGeckos = [...geckos].sort((a, b) => {
        return new Date(a.lastModified) - new Date(b.lastModified);
    });
    
    sortedGeckos.forEach(gecko => {
        const geckoCard = document.createElement('div');
        geckoCard.className = 'gecko-card';
        geckoCard.setAttribute('data-gecko-id', gecko.id);
        
        // 첫 번째 사진만 표시 (없으면 기본 이미지)
        const photoSrc = gecko.photos && gecko.photos.length > 0 
            ? gecko.photos[0] 
            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gaW1hZ2U8L3RleHQ+PC9zdmc+';
        
        geckoCard.innerHTML = `
            <div class="gecko-photos">
                <img src="${photoSrc}" alt="${gecko.name}" loading="lazy">
            </div>
            <div class="gecko-name">${gecko.name}</div>
        `;
        
        // 클릭 이벤트로 상세 정보 토글
        geckoCard.addEventListener('click', function() {
            const detailsDiv = document.querySelector(`.gecko-details[data-gecko-id="${gecko.id}"]`);
            if (detailsDiv) {
                detailsDiv.remove();
            } else {
                showGeckoDetails(gecko);
            }
        });
        
        geckoList.appendChild(geckoCard);
    });
}

// 개체 상세 정보 표시
function showGeckoDetails(gecko) {
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'gecko-details';
    detailsDiv.setAttribute('data-gecko-id', gecko.id);
    
    const latestWeight = gecko.weightHistory[gecko.weightHistory.length - 1]?.weight || 0;
    
    detailsDiv.innerHTML = `
        <div class="gecko-info">
            <button class="close-details" onclick="this.closest('.gecko-details').remove()">✕</button>
            <form class="edit-form" onsubmit="updateGecko(event, ${gecko.id})">
                <div class="form-group">
                    <label>⬜ 이름:</label>
                    <input type="text" name="name" value="${gecko.name}" required>
                </div>
                
                <div class="form-group">
                    <label>⬜ 해칭일:</label>
                    <input type="date" name="hatchDate" value="${gecko.hatchDate}">
                </div>
                
                <div class="form-group">
                    <label>⬜ 현재 무게 (g):</label>
                    <input type="number" name="weight" step="0.1" value="${latestWeight}">
                </div>
                
                <div class="form-group">
                    <label>⬜ 사진:</label>
                    <div class="photo-grid">
                        ${gecko.photos.map((photo, index) => `
                            <div class="photo-item">
                                <img src="${photo}" alt="Gecko photo">
                                <button type="button" onclick="removePhoto(${gecko.id}, ${index})">삭제</button>
                            </div>
                        `).join('')}
                    </div>
                    <input type="file" name="newPhotos" accept="image/*" multiple>
                </div>
                
                <div class="parent-info-section">
                    <h3>⬜ 부모 정보</h3>
                    
                    <div class="form-group">
                        <label>⬜ 부 이름:</label>
                        <input type="text" name="fatherName" value="${gecko.fatherName || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>⬜ 부 사진:</label>
                        <div class="photo-grid">
                            ${gecko.fatherPhotos.map((photo, index) => `
                                <div class="photo-item">
                                    <img src="${photo}" alt="Father photo">
                                    <button type="button" onclick="removeFatherPhoto(${gecko.id}, ${index})">삭제</button>
                                </div>
                            `).join('')}
                        </div>
                        <input type="file" name="newFatherPhotos" accept="image/*" multiple>
                    </div>
                    
                    <div class="form-group">
                        <label>⬜ 모 이름:</label>
                        <input type="text" name="motherName" value="${gecko.motherName || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>⬜ 모 사진:</label>
                        <div class="photo-grid">
                            ${gecko.motherPhotos.map((photo, index) => `
                                <div class="photo-item">
                                    <img src="${photo}" alt="Mother photo">
                                    <button type="button" onclick="removeMotherPhoto(${gecko.id}, ${index})">삭제</button>
                                </div>
                            `).join('')}
                        </div>
                        <input type="file" name="newMotherPhotos" accept="image/*" multiple>
                    </div>
                </div>
                
                <div class="weight-history">
                    <h4>⬜ 무게 기록</h4>
                    <ul>
                        ${gecko.weightHistory.map(record => `
                            <li>⬜ ${record.date}: ${record.weight}g</li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="save-btn">⬜ 저장</button>
                    <button type="button" onclick="deleteGecko(${gecko.id})" class="delete-btn">⬜ 삭제</button>
                </div>
            </form>
        </div>
    `;
    
    document.querySelector('.gecko-list').appendChild(detailsDiv);
}

// 사진 삭제 함수들
function removePhoto(geckoId, photoIndex) {
    const gecko = geckos.find(g => g.id === geckoId);
    if (gecko) {
        gecko.photos.splice(photoIndex, 1);
        saveGeckos();
        displayGeckos();
    }
}

function removeFatherPhoto(geckoId, photoIndex) {
    const gecko = geckos.find(g => g.id === geckoId);
    if (gecko) {
        gecko.fatherPhotos.splice(photoIndex, 1);
        saveGeckos();
        displayGeckos();
    }
}

function removeMotherPhoto(geckoId, photoIndex) {
    const gecko = geckos.find(g => g.id === geckoId);
    if (gecko) {
        gecko.motherPhotos.splice(photoIndex, 1);
        saveGeckos();
        displayGeckos();
    }
}

// 페이지 로드 시 데이터 로드 및 표시
document.addEventListener('DOMContentLoaded', function() {
    loadGeckos();
    displayGeckos();
    
    // 주기적으로 데이터 저장 상태 확인
    setInterval(saveGeckos, 30000); // 30초마다 저장
});

// 비밀번호 상수
const PASSWORD = '0801';

// 페이지 로드 시 비밀번호 모달 표시
document.addEventListener('DOMContentLoaded', () => {
    const passwordModal = document.getElementById('passwordModal');
    const mainContent = document.getElementById('mainContent');
    const passwordInput = document.getElementById('passwordInput');
    const submitPassword = document.getElementById('submitPassword');
    const passwordError = document.getElementById('passwordError');

    // 비밀번호 확인 함수
    const checkPassword = () => {
        const input = passwordInput.value;
        if (input === PASSWORD) {
            passwordModal.style.display = 'none';
            mainContent.style.display = 'block';
            passwordError.textContent = '';
            passwordInput.value = '';
        } else {
            passwordError.textContent = '비밀번호가 일치하지 않습니다.';
            passwordInput.value = '';
        }
    };

    // 비밀번호 입력 필드에서 Enter 키 처리
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    // 확인 버튼 클릭 처리
    submitPassword.addEventListener('click', checkPassword);

    // 초기 화면 설정
    passwordModal.style.display = 'flex';
    mainContent.style.display = 'none';
});

// D-DAY 관련 변수
const toggleDdayForm = document.getElementById('toggleDdayForm');
const addDdayForm = document.getElementById('addDdayForm');
const ddayForm = document.getElementById('ddayForm');
const cancelDdayAdd = document.getElementById('cancelDdayAdd');

// D-DAY 계산 함수
function calculateDday(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// D-DAY 표시 함수
function getDdayDisplay(days) {
    if (days > 0) return `D-${days}`;
    if (days < 0) return `D+${Math.abs(days)}`;
    return 'D-Day';
}

// D-DAY 클래스 결정 함수
function getDdayClass(days) {
    if (days > 0) return 'dday-future';
    if (days < 0) return 'dday-past';
    return 'dday-today';
}

// D-DAY 목록 표시
function displayDdays() {
    const ddayList = document.getElementById('ddayList');
    ddayList.innerHTML = '';
    
    if (ddays.length === 0) {
        ddayList.innerHTML = '<p class="empty-message">⬜ 등록된 D-DAY가 없습니다.</p>';
        return;
    }
    
    // 최신 항목이 나중에 오도록 정렬
    const sortedDdays = [...ddays].sort((a, b) => {
        return new Date(a.lastModified) - new Date(b.lastModified);
    });
    
    sortedDdays.forEach(dday => {
        const ddayCard = document.createElement('div');
        ddayCard.className = 'gecko-card dday-card';
        ddayCard.setAttribute('data-dday-id', dday.id);
        
        // 첫 번째 사진만 표시 (없으면 기본 이미지)
        const photoSrc = dday.photos && dday.photos.length > 0 
            ? dday.photos[0] 
            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gaW1hZ2U8L3RleHQ+PC9zdmc+';
        
        // D-DAY 계산
        const days = calculateDday(dday.date);
        const ddayClass = getDdayClass(days);
        const ddayDisplay = getDdayDisplay(days);
        
        ddayCard.innerHTML = `
            <div class="gecko-photos">
                <img src="${photoSrc}" alt="${dday.name}" loading="lazy">
                <div class="dday-count ${ddayClass}">${ddayDisplay}</div>
            </div>
            <div class="gecko-name">${dday.name}</div>
        `;
        
        // 클릭 이벤트로 상세 정보 토글
        ddayCard.addEventListener('click', function() {
            const detailsDiv = document.querySelector(`.dday-details[data-dday-id="${dday.id}"]`);
            if (detailsDiv) {
                detailsDiv.remove();
            } else {
                showDdayDetails(dday);
            }
        });
        
        ddayList.appendChild(ddayCard);
    });
}

// D-DAY 상세 정보 표시
function showDdayDetails(dday) {
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'dday-details';
    detailsDiv.setAttribute('data-dday-id', dday.id);
    
    detailsDiv.innerHTML = `
        <div class="gecko-info">
            <button class="close-details" onclick="this.closest('.dday-details').remove()">✕</button>
            <form class="edit-form" onsubmit="updateDday(event, ${dday.id})">
                <div class="form-group">
                    <label>⬜ 이름:</label>
                    <input type="text" name="name" value="${dday.name}" required>
                </div>
                
                <div class="form-group">
                    <label>⬜ 산란일:</label>
                    <input type="date" name="date" value="${dday.date}">
                </div>
                
                <div class="form-group">
                    <label>⬜ 사진:</label>
                    <div class="photo-grid">
                        ${dday.photos.map((photo, index) => `
                            <div class="photo-item">
                                <img src="${photo}" alt="D-DAY photo">
                                <button type="button" onclick="removeDdayPhoto(${dday.id}, ${index})">삭제</button>
                            </div>
                        `).join('')}
                    </div>
                    <input type="file" name="newPhotos" accept="image/*" multiple>
                </div>
                
                <div class="parent-info-section">
                    <h3>⬜ 부모 정보</h3>
                    
                    <div class="form-group">
                        <label>⬜ 부 이름:</label>
                        <input type="text" name="fatherName" value="${dday.fatherName || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>⬜ 부 사진:</label>
                        <div class="photo-grid">
                            ${dday.fatherPhotos.map((photo, index) => `
                                <div class="photo-item">
                                    <img src="${photo}" alt="Father photo">
                                    <button type="button" onclick="removeDdayFatherPhoto(${dday.id}, ${index})">삭제</button>
                                </div>
                            `).join('')}
                        </div>
                        <input type="file" name="newFatherPhotos" accept="image/*" multiple>
                    </div>
                    
                    <div class="form-group">
                        <label>⬜ 모 이름:</label>
                        <input type="text" name="motherName" value="${dday.motherName || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>⬜ 모 사진:</label>
                        <div class="photo-grid">
                            ${dday.motherPhotos.map((photo, index) => `
                                <div class="photo-item">
                                    <img src="${photo}" alt="Mother photo">
                                    <button type="button" onclick="removeDdayMotherPhoto(${dday.id}, ${index})">삭제</button>
                                </div>
                            `).join('')}
                        </div>
                        <input type="file" name="newMotherPhotos" accept="image/*" multiple>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="save-btn">⬜ 저장</button>
                    <button type="button" onclick="deleteDday(${dday.id})" class="delete-btn">⬜ 삭제</button>
                </div>
            </form>
        </div>
    `;
    
    document.querySelector('.dday-list').appendChild(detailsDiv);
}

// D-DAY 정보 업데이트
async function updateDday(event, ddayId) {
    event.preventDefault();
    const form = event.target;
    const dday = ddays.find(d => d.id === ddayId);
    if (!dday) return;
    
    try {
        // 기본 정보 업데이트
        dday.name = form.name.value;
        dday.date = form.date.value;
        
        // 새로운 사진 처리
        const newPhotos = form.newPhotos.files;
        if (newPhotos.length > 0) {
            for (let file of newPhotos) {
                const compressedImage = await compressImage(file);
                dday.photos.push(compressedImage);
            }
        }
        
        // 새로운 부 사진 처리
        const newFatherPhotos = form.newFatherPhotos.files;
        if (newFatherPhotos.length > 0) {
            for (let file of newFatherPhotos) {
                const compressedImage = await compressImage(file);
                dday.fatherPhotos.push(compressedImage);
            }
        }
        
        // 새로운 모 사진 처리
        const newMotherPhotos = form.newMotherPhotos.files;
        if (newMotherPhotos.length > 0) {
            for (let file of newMotherPhotos) {
                const compressedImage = await compressImage(file);
                dday.motherPhotos.push(compressedImage);
            }
        }
        
        // 부모 정보 업데이트
        dday.fatherName = form.fatherName.value;
        dday.motherName = form.motherName.value;
        
        dday.lastModified = new Date().toISOString();
        saveDdays();
        displayDdays();
        
        // 상세 정보 뷰 제거
        const detailsDiv = document.querySelector(`.dday-details[data-dday-id="${ddayId}"]`);
        if (detailsDiv) {
            detailsDiv.remove();
        }
        
        // 성공 메시지 표시
        showMessage('D-DAY 정보가 성공적으로 저장되었습니다.');
        
    } catch (error) {
        console.error('D-DAY 정보 업데이트 중 오류 발생:', error);
        showMessage('D-DAY 정보 업데이트 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// D-DAY 삭제
function deleteDday(id) {
    if (confirm('정말로 이 D-DAY를 삭제하시겠습니까?')) {
        try {
            const index = ddays.findIndex(d => d.id === id);
            if (index !== -1) {
                ddays.splice(index, 1);
                saveDdays();
                displayDdays();
                
                // 상세 정보 뷰 제거
                const detailsDiv = document.querySelector(`.dday-details[data-dday-id="${id}"]`);
                if (detailsDiv) {
                    detailsDiv.remove();
                }
                
                showMessage('D-DAY가 성공적으로 삭제되었습니다.');
            }
        } catch (error) {
            console.error('D-DAY 삭제 중 오류 발생:', error);
            showMessage('D-DAY 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }
}

// D-DAY 사진 삭제 함수들
function removeDdayPhoto(ddayId, photoIndex) {
    const dday = ddays.find(d => d.id === ddayId);
    if (dday) {
        dday.photos.splice(photoIndex, 1);
        saveDdays();
        displayDdays();
    }
}

function removeDdayFatherPhoto(ddayId, photoIndex) {
    const dday = ddays.find(d => d.id === ddayId);
    if (dday) {
        dday.fatherPhotos.splice(photoIndex, 1);
        saveDdays();
        displayDdays();
    }
}

function removeDdayMotherPhoto(ddayId, photoIndex) {
    const dday = ddays.find(d => d.id === ddayId);
    if (dday) {
        dday.motherPhotos.splice(photoIndex, 1);
        saveDdays();
        displayDdays();
    }
}

// D-DAY 폼 토글
toggleDdayForm.addEventListener('click', () => {
    addDdayForm.style.display = addDdayForm.style.display === 'none' ? 'block' : 'none';
    if (addDdayForm.style.display === 'block') {
        addDdayForm.scrollIntoView({ behavior: 'smooth' });
    }
});

// D-DAY 추가 취소
cancelDdayAdd.addEventListener('click', () => {
    addDdayForm.style.display = 'none';
    ddayForm.reset();
    clearDdayPhotoPreviews();
});

// D-DAY 사진 미리보기 초기화
function clearDdayPhotoPreviews() {
    document.getElementById('ddayPhotoPreview').innerHTML = '';
    document.getElementById('ddayFatherPhotoPreview').innerHTML = '';
    document.getElementById('ddayMotherPhotoPreview').innerHTML = '';
}

// D-DAY 사진 미리보기 설정
setupImagePreview('ddayPhotos', 'ddayPhotoPreview', true);
setupImagePreview('ddayFatherPhotos', 'ddayFatherPhotoPreview', true);
setupImagePreview('ddayMotherPhotos', 'ddayMotherPhotoPreview', true);

// D-DAY 폼 제출
ddayForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const dday = {
        id: Date.now(),
        name: document.getElementById('ddayName').value,
        hatchDate: document.getElementById('ddayDate').value,
        photos: Array.from(document.getElementById('ddayPhotoPreview').querySelectorAll('img')).map(img => img.src),
        fatherName: document.getElementById('ddayFatherName').value,
        fatherPhotos: Array.from(document.getElementById('ddayFatherPhotoPreview').querySelectorAll('img')).map(img => img.src),
        motherName: document.getElementById('ddayMotherName').value,
        motherPhotos: Array.from(document.getElementById('ddayMotherPhotoPreview').querySelectorAll('img')).map(img => img.src)
    };
    
    ddays.push(dday);
    saveDdays();
    
    this.reset();
    clearDdayPhotoPreviews();
    addDdayForm.style.display = 'none';
    displayDdays();
});

// D-DAY 저장
function saveDdays() {
    try {
        localStorage.setItem('ddays', JSON.stringify(ddays));
    } catch (error) {
        console.error('D-DAY 저장 중 오류 발생:', error);
    }
}

// D-DAY 로드
function loadDdays() {
    try {
        const savedDdays = localStorage.getItem('ddays');
        ddays = savedDdays ? JSON.parse(savedDdays) : [];
    } catch (error) {
        console.error('D-DAY 로드 중 오류 발생:', error);
        ddays = [];
    }
}

// D-DAY 수정
function editDday(index) {
    const dday = ddays[index];
    document.getElementById('ddayName').value = dday.name;
    document.getElementById('ddayDate').value = dday.hatchDate;
    document.getElementById('ddayFatherName').value = dday.fatherName || '';
    document.getElementById('ddayMotherName').value = dday.motherName || '';
    
    // 사진 미리보기 설정
    const photoPreview = document.getElementById('ddayPhotoPreview');
    const fatherPhotoPreview = document.getElementById('ddayFatherPhotoPreview');
    const motherPhotoPreview = document.getElementById('ddayMotherPhotoPreview');
    
    photoPreview.innerHTML = dday.photos.map(photo => `<img src="${photo}" alt="D-DAY photo">`).join('');
    fatherPhotoPreview.innerHTML = dday.fatherPhotos.map(photo => `<img src="${photo}" alt="Father photo">`).join('');
    motherPhotoPreview.innerHTML = dday.motherPhotos.map(photo => `<img src="${photo}" alt="Mother photo">`).join('');
    
    addDdayForm.style.display = 'block';
    addDdayForm.scrollIntoView({ behavior: 'smooth' });
    
    // 기존 D-DAY 삭제
    ddays.splice(index, 1);
    saveDdays();
    displayDdays();
}

// D-DAY 삭제
function deleteDday(index) {
    if (confirm('이 D-DAY를 삭제하시겠습니까?')) {
        ddays.splice(index, 1);
        saveDdays();
        displayDdays();
    }
}

// 페이지 로드 시 D-DAY 로드
document.addEventListener('DOMContentLoaded', () => {
    loadDdays();
    displayDdays();
});

// 이미지 프리뷰 초기화 함수
function clearPhotoPreviews() {
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('fatherPhotoPreview').innerHTML = '';
    document.getElementById('motherPhotoPreview').innerHTML = '';
}
