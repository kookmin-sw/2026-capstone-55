/**
 * AuthService - 사용자 인증 서비스
 * StorageService를 사용하여 사용자 등록, 로그인, 프로필 관리 기능 제공
 */

const AuthService = (() => {
  const USERS_KEY = 'users';
  const AUTH_TOKEN_KEY = 'authToken';
  const CURRENT_USER_KEY = 'currentUser';

  /**
   * 간이 비밀번호 해싱 (프론트엔드 전용)
   * @param {string} password
   * @returns {string}
   */
  function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수 변환
    }
    return 'hash_' + Math.abs(hash).toString(36);
  }

  /**
   * 모든 사용자 목록 조회
   * @returns {User[]}
   */
  function getUsers() {
    return StorageService.get(USERS_KEY, []);
  }

  /**
   * 사용자 목록 저장
   * @param {User[]} users
   */
  function saveUsers(users) {
    StorageService.set(USERS_KEY, users);
  }

  /**
   * 회원가입 (서버 API 연동)
   */
  async function register(data) {
    const { name, email, password } = data;
    if (!name || !name.trim()) return { success: false, error: '이름을 입력하세요.' };
    if (!email || !email.trim()) return { success: false, error: '이메일을 입력하세요.' };
    if (!password || password.length < 4) return { success: false, error: '비밀번호는 4자 이상이어야 합니다.' };

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const result = await res.json();
      if (!result.success) return { success: false, error: result.error };

      const newUser = result.user;
      createAuthToken(newUser.id);
      setCurrentUser(newUser);
      // 서버에 이미 저장됨 — 로컬 캐시 덮어쓰기 방지를 위해 syncFromServer 호출
      try { await StorageService.syncFromServer(); } catch(e) {}
      return { success: true, user: newUser };
    } catch(e) {
      // 서버 연결 실패 시 로컬 fallback
      const users = getUsers();
      const exists = users.find(u => u.email === email.trim().toLowerCase());
      if (exists) return { success: false, error: '이미 사용 중인 이메일입니다.' };
      const newUser = {
        id: StorageService.generateId(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        nickname: '',
        passwordHash: hashPassword(password),
        referralCode: generateReferralCode(),
        dogs: [],
        pawCoins: 3000,
        createdAt: StorageService.now()
      };
      users.push(newUser);
      saveUsers(users);
      createAuthToken(newUser.id);
      setCurrentUser(newUser);
      return { success: true, user: newUser };
    }
  }

  /**
   * 로그인 (서버 API 연동)
   */
  async function login(email, password) {
    if (!email || !password) return { success: false, error: '이메일과 비밀번호를 입력하세요.' };

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await res.json();
      if (!result.success) return { success: false, error: result.error };

      const user = result.user;
      createAuthToken(user.id);
      setCurrentUser(user);
      return { success: true };
    } catch(e) {
      // 서버 연결 실패 시 로컬 fallback
      const users = getUsers();
      const user = users.find(u => u.email === email.trim().toLowerCase());
      if (!user || user.passwordHash !== hashPassword(password)) {
        return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
      }
      createAuthToken(user.id);
      setCurrentUser(user);
      return { success: true };
    }
  }

  /**
   * AuthToken 생성
   * @param {string} userId
   * @returns {AuthToken}
   */
  function createAuthToken(userId) {
    const token = {
      token: StorageService.generateId(),
      userId: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    StorageService.set(AUTH_TOKEN_KEY, token);
    return token;
  }

  /**
   * 현재 사용자 설정
   * @param {User} user
   */
  function setCurrentUser(user) {
    // passwordHash 제외하고 저장
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    StorageService.set(CURRENT_USER_KEY, safeUser);
  }

  /**
   * 현재 로그인된 사용자 조회
   * @returns {User|null}
   */
  function getCurrentUser() {
    const token = StorageService.get(AUTH_TOKEN_KEY);
    if (!token) {
      return null;
    }

    // 토큰 만료 확인
    if (new Date(token.expiresAt) < new Date()) {
      logout();
      return null;
    }

    return StorageService.get(CURRENT_USER_KEY, null);
  }

  /**
   * 사용자 프로필 업데이트
   * @param {string} userId
   * @param {{ name?: string, profileImage?: string }} data
   * @returns {{ success: boolean, user?: User, error?: string }}
   */
  function updateProfile(userId, data) {
    const applyUpdates = (user) => {
      const updated = { ...user };
      if (data.name) {
        updated.name = data.name.trim();
      }
      if (data.profileImage !== undefined) {
        updated.profileImage = data.profileImage;
      }
      return updated;
    };

    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      const currentUser = StorageService.get(CURRENT_USER_KEY, null);
      if (currentUser && currentUser.id === userId) {
        const updatedUser = applyUpdates(currentUser);
        setCurrentUser(updatedUser);
        fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(() => {});
        return { success: true, user: updatedUser };
      }
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    users[index] = applyUpdates(users[index]);

    saveUsers(users);
    setCurrentUser(users[index]);

    fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});

    return { success: true, user: users[index] };
  }

  /**
   * 반려견 등록
   * @param {string} userId
   * @param {{ name: string, breed: string, age: number, size: string }} dogData
   * @returns {{ success: boolean, dog?: Dog, error?: string }}
   */
  function registerDog(userId, dogData) {
    if (!dogData.name || !dogData.name.trim()) {
      return { success: false, error: '반려견 이름을 입력하세요.' };
    }
    if (!dogData.breed) {
      return { success: false, error: '품종을 선택하세요.' };
    }
    if (!dogData.age || dogData.age < 0) {
      return { success: false, error: '올바른 나이를 입력하세요.' };
    }
    if (!dogData.size) {
      return { success: false, error: '크기를 선택하세요.' };
    }

    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    const newDog = {
      id: StorageService.generateId(),
      name: dogData.name.trim(),
      breed: dogData.breed,
      age: Number(dogData.age),
      size: dogData.size,
      gender: dogData.gender || null,
      weight: dogData.weight ? Number(dogData.weight) : null,
      neutered: dogData.neutered != null ? dogData.neutered : null,
      personality: dogData.personality || null,
      healthNote: dogData.healthNote || null,
      photo: dogData.photo || null
    };

    if (!users[index].dogs) {
      users[index].dogs = [];
    }
    users[index].dogs.push(newDog);

    saveUsers(users);
    setCurrentUser(users[index]);

    return { success: true, dog: newDog };
  }

  /**
   * 로그아웃
   */
  function logout() {
    StorageService.remove(AUTH_TOKEN_KEY);
    StorageService.remove(CURRENT_USER_KEY);
  }

  /**
   * 추천인 코드 생성 (6자리 영숫자)
   */
  function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'PAW-' + code;
  }

  /**
   * 추천인 코드로 사용자 찾기
   */
  function findByReferralCode(code) {
    const users = getUsers();
    return users.find(u => u.referralCode === code) || null;
  }

  /**
   * 닉네임 설정
   */
  function setNickname(userId, nickname) {
    if (!nickname || !nickname.trim()) {
      return { success: false, error: '닉네임을 입력해주세요.' };
    }
    if (nickname.trim().length < 2 || nickname.trim().length > 12) {
      return { success: false, error: '닉네임은 2~12자로 입력해주세요.' };
    }
    const users = getUsers();
    const duplicate = users.find(u => u.nickname === nickname.trim() && u.id !== userId);
    if (duplicate) {
      return { success: false, error: '이미 사용 중인 닉네임이에요.' };
    }
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, error: '사용자를 찾을 수 없습니다.' };

    // 2주 제한 체크 (첫 설정은 제한 없음)
    if (users[index].nickname && users[index].nicknameChangedAt) {
      const lastChanged = new Date(users[index].nicknameChangedAt);
      const twoWeeks = 14 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastChanged.getTime() < twoWeeks) {
        const nextDate = new Date(lastChanged.getTime() + twoWeeks);
        return { success: false, error: `닉네임은 2주에 한 번만 변경할 수 있어요. 다음 변경 가능일: ${nextDate.toLocaleDateString('ko-KR')}` };
      }
    }

    users[index].nickname = nickname.trim();
    users[index].nicknameChangedAt = StorageService.now();
    saveUsers(users);
    setCurrentUser(users[index]);
    return { success: true };
  }

  /**
   * 추천인 코드 적용 (한 번만 가능)
   */
  function applyReferralCode(userId, code) {
    if (!code || !code.trim()) {
      return { success: false, error: '추천인 코드를 입력해주세요.' };
    }
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, error: '사용자를 찾을 수 없습니다.' };

    if (users[index].usedReferralCode) {
      return { success: false, error: '이미 추천인 코드를 사용했어요.' };
    }

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode === users[index].referralCode) {
      return { success: false, error: '본인의 추천인 코드는 입력할 수 없어요.' };
    }

    const referrer = findByReferralCode(trimmedCode);
    if (!referrer) {
      return { success: false, error: '존재하지 않는 추천인 코드예요.' };
    }

    users[index].usedReferralCode = trimmedCode;
    saveUsers(users);
    setCurrentUser(users[index]);

    // 코인 지급
    if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
      WalletService.earnCoins(userId, 3000, '추천인 코드 입력 보상');
      WalletService.earnCoins(referrer.id, 1500, (users[index].nickname || users[index].name) + '님의 추천 보상');
    }

    return { success: true, referrerName: referrer.nickname || referrer.name };
  }

  /**
   * 회원탈퇴
   */
  function deleteAccount(userId) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    users.splice(index, 1);
    saveUsers(users);
    logout();
    return { success: true };
  }

  return {
    register,
    login,
    getCurrentUser,
    updateProfile,
    registerDog,
    logout,
    deleteAccount,
    generateReferralCode,
    findByReferralCode,
    setNickname,
    applyReferralCode,
    hashPassword
  };
})();
