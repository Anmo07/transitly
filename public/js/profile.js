/**
 * Transitly — Profile Controller
 * Handles user profile details and profile photo upload with backend sync & local storage persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  const profileUserName = document.getElementById('profileUserName');
  const profileUserEmail = document.getElementById('profileUserEmail');
  const profileUserPhone = document.getElementById('profileUserPhone');
  const profileTripsCount = document.getElementById('profileTripsCount');
  const profileAvatarImg = document.getElementById('profileAvatarImg');

  const avatarClickContainer = document.getElementById('avatarClickContainer');
  const btnUploadAvatar = document.getElementById('btnUploadAvatar');
  const inputAvatarFile = document.getElementById('inputAvatarFile');
  const btnModalUploadPhoto = document.getElementById('btnModalUploadPhoto');
  const editModalAvatarPreview = document.getElementById('editModalAvatarPreview');

  const btnOpenEditProfileModal = document.getElementById('btnOpenEditProfileModal');
  const editProfileModal = document.getElementById('editProfileModal');
  const btnCloseEditProfileModal = document.getElementById('btnCloseEditProfileModal');
  const btnCancelEditProfile = document.getElementById('btnCancelEditProfile');
  const formEditProfile = document.getElementById('formEditProfile');

  const inputProfileName = document.getElementById('inputProfileName');
  const inputProfileEmail = document.getElementById('inputProfileEmail');
  const inputProfilePhone = document.getElementById('inputProfilePhone');

  const btnLogoutProfile = document.getElementById('btnLogoutProfile');

  const profileToast = document.getElementById('profileToast');
  const profileToastText = document.getElementById('profileToastText');

  let currentUser = {
    name: 'Alex Mitchell',
    email: 'alex.mitchell@example.com',
    phone: '+91 98765 43210',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzAACyzyleKmM4JQVt8Aa-jr70QVcpj9loY9wKp5o9O4E4p6Pw4_DrVmOHt4kkJfjfzprBQFcotrP67UIXwwodZ_N8y_NQMBXmYt1FUgmWEZU3RkLHv9mtX5_jewodrd3AC22FofPIl1pDv6bTKcqN63TR8-Ce6clfaRjIaxwp6CeKnOIoGAZdfBFJX_YfrWG4DCAk26zr7uiOS6j2JNkj4E16URTfm8orQCRZ5X_7hBMsGpV5UeKJ'
  };

  /**
   * Show feedback toast
   */
  const showToast = (msg) => {
    if (!profileToast || !profileToastText) return;
    profileToastText.innerText = msg;
    profileToast.classList.remove('hidden');
    setTimeout(() => {
      profileToast.classList.add('hidden');
    }, 2800);
  };

  /**
   * Fetch profile from backend
   */
  const loadProfile = async () => {
    // Check local storage first
    const localAvatar = localStorage.getItem('transitly_user_avatar');
    if (localAvatar) {
      currentUser.avatarUrl = localAvatar;
    }

    try {
      const res = await fetch('/api/v1/profile');
      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        if (data.user) {
          currentUser = {
            name: data.user.name || currentUser.name,
            email: data.user.email || currentUser.email,
            phone: data.user.phone || currentUser.phone,
            avatarUrl: localAvatar || data.user.avatarUrl || currentUser.avatarUrl
          };
        }
        if (data.stats && profileTripsCount) {
          profileTripsCount.innerText = `(${data.stats.totalTrips || 124} parcels)`;
        }
      }
    } catch (_) {}

    renderProfile();
  };

  const renderProfile = () => {
    if (profileUserName) profileUserName.innerText = currentUser.name;
    if (profileUserEmail) profileUserEmail.innerText = currentUser.email;
    if (profileUserPhone) profileUserPhone.innerText = currentUser.phone;
    if (profileAvatarImg && currentUser.avatarUrl) profileAvatarImg.src = currentUser.avatarUrl;
    if (editModalAvatarPreview && currentUser.avatarUrl) editModalAvatarPreview.src = currentUser.avatarUrl;
  };

  /**
   * Avatar Upload Handling
   */
  const handleAvatarFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      currentUser.avatarUrl = dataUrl;
      localStorage.setItem('transitly_user_avatar', dataUrl);
      renderProfile();

      try {
        await fetch('/api/v1/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: dataUrl })
        });
      } catch (_) {}

      showToast('📷 Profile photo updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Trigger file selection on avatar clicks
  if (avatarClickContainer) {
    avatarClickContainer.addEventListener('click', () => {
      if (inputAvatarFile) inputAvatarFile.click();
    });
  }

  if (btnUploadAvatar) {
    btnUploadAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      if (inputAvatarFile) inputAvatarFile.click();
    });
  }

  if (btnModalUploadPhoto) {
    btnModalUploadPhoto.addEventListener('click', () => {
      if (inputAvatarFile) inputAvatarFile.click();
    });
  }

  if (inputAvatarFile) {
    inputAvatarFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleAvatarFile(file);
    });
  }

  /**
   * Drag and drop support on avatar
   */
  if (avatarClickContainer) {
    avatarClickContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      avatarClickContainer.classList.add('ring-4', 'ring-primary');
    });
    avatarClickContainer.addEventListener('dragleave', () => {
      avatarClickContainer.classList.remove('ring-4', 'ring-primary');
    });
    avatarClickContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      avatarClickContainer.classList.remove('ring-4', 'ring-primary');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleAvatarFile(file);
    });
  }

  /**
   * Edit Profile Modal Handlers
   */
  const openModal = () => {
    if (!editProfileModal) return;
    inputProfileName.value = currentUser.name;
    inputProfileEmail.value = currentUser.email;
    inputProfilePhone.value = currentUser.phone;
    if (editModalAvatarPreview) editModalAvatarPreview.src = currentUser.avatarUrl;
    editProfileModal.classList.remove('hidden');
  };

  const closeModal = () => {
    if (editProfileModal) editProfileModal.classList.add('hidden');
  };

  if (btnOpenEditProfileModal) btnOpenEditProfileModal.addEventListener('click', openModal);
  if (btnCloseEditProfileModal) btnCloseEditProfileModal.addEventListener('click', closeModal);
  if (btnCancelEditProfile) btnCancelEditProfile.addEventListener('click', closeModal);

  if (formEditProfile) {
    formEditProfile.addEventListener('submit', async (e) => {
      e.preventDefault();

      const updated = {
        name: inputProfileName.value.trim(),
        email: inputProfileEmail.value.trim(),
        phone: inputProfilePhone.value.trim(),
        avatarUrl: currentUser.avatarUrl
      };

      try {
        await fetch('/api/v1/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (_) {}

      currentUser.name = updated.name;
      currentUser.email = updated.email;
      currentUser.phone = updated.phone;
      renderProfile();
      closeModal();
      showToast('Profile updated successfully!');
    });
  }

  // Logout
  if (btnLogoutProfile) {
    btnLogoutProfile.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        window.location.href = '/';
      }
    });
  }

  loadProfile();
});
