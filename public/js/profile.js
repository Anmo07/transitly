/**
 * Transitly — Profile Controller
 * Handles user profile details and profile photo upload from local device storage with instant preview, backend sync & local storage persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  const profileUserName = document.getElementById('profileUserName');
  const profileUserEmail = document.getElementById('profileUserEmail');
  const profileUserPhone = document.getElementById('profileUserPhone');
  const profileTripsCount = document.getElementById('profileTripsCount');
  const profileAvatarImg = document.getElementById('profileAvatarImg');

  // Photo Upload Trigger Elements
  const inputAvatarFile = document.getElementById('inputAvatarFile');
  const inputModalAvatarFile = document.getElementById('inputModalAvatarFile');
  const editModalAvatarPreview = document.getElementById('editModalAvatarPreview');
  const btnRemoveAvatar = document.getElementById('btnRemoveAvatar');

  // Modal Elements
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

  const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzAACyzyleKmM4JQVt8Aa-jr70QVcpj9loY9wKp5o9O4E4p6Pw4_DrVmOHt4kkJfjfzprBQFcotrP67UIXwwodZ_N8y_NQMBXmYt1FUgmWEZU3RkLHv9mtX5_jewodrd3AC22FofPIl1pDv6bTKcqN63TR8-Ce6clfaRjIaxwp6CeKnOIoGAZdfBFJX_YfrWG4DCAk26zr7uiOS6j2JNkj4E16URTfm8orQCRZ5X_7hBMsGpV5UeKJ';

  let currentUser = {
    name: 'Anmol',
    email: 'anmolrajotiy@gmail.com',
    phone: '+91 7988342544',
    avatarUrl: DEFAULT_AVATAR
  };

  /**
   * Show feedback toast
   */
  const showToast = (msg, isSuccess = true) => {
    if (!profileToast || !profileToastText) return;
    profileToastText.innerText = msg;
    const icon = profileToast.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.className = `material-symbols-outlined text-sm ${isSuccess ? 'text-emerald-400' : 'text-amber-400'}`;
      icon.innerText = isSuccess ? 'check_circle' : 'info';
    }
    profileToast.classList.remove('hidden');
    setTimeout(() => {
      profileToast.classList.add('hidden');
    }, 3200);
  };

  /**
   * Fetch profile from backend
   */
  const loadProfile = async () => {
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
    if (profileAvatarImg) profileAvatarImg.src = currentUser.avatarUrl || DEFAULT_AVATAR;
    if (editModalAvatarPreview) editModalAvatarPreview.src = currentUser.avatarUrl || DEFAULT_AVATAR;
  };

  /**
   * Process and upload image from local device storage
   */
  const processImageFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target.result;

      // 1. Instant optimistic UI update
      currentUser.avatarUrl = rawData;
      localStorage.setItem('transitly_user_avatar', rawData);
      renderProfile();
      showToast('📷 Profile photo uploaded from device!');

      // 2. High performance background canvas center-crop and compression
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 400;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

          currentUser.avatarUrl = optimizedDataUrl;
          localStorage.setItem('transitly_user_avatar', optimizedDataUrl);
          renderProfile();

          // Sync with database
          await fetch('/api/v1/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: optimizedDataUrl })
          });
        } catch (err) {
          // Fallback to raw dataUrl
          fetch('/api/v1/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: rawData })
          }).catch(() => {});
        }
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  // Main input change listener
  if (inputAvatarFile) {
    inputAvatarFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) processImageFile(file);
    });
  }

  // Modal input change listener
  if (inputModalAvatarFile) {
    inputModalAvatarFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) processImageFile(file);
    });
  }

  // Remove / Reset Avatar
  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentUser.avatarUrl = DEFAULT_AVATAR;
      localStorage.removeItem('transitly_user_avatar');
      renderProfile();
      try {
        await fetch('/api/v1/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: DEFAULT_AVATAR })
        });
      } catch (_) {}
      showToast('Default profile picture restored.');
    });
  }

  /**
   * Drag and drop support
   */
  const avatarClickContainer = document.getElementById('avatarClickContainer');
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
      if (file) processImageFile(file);
    });
  }

  const modalDropZone = document.getElementById('modalDropZone');
  if (modalDropZone) {
    modalDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      modalDropZone.classList.add('border-primary', 'bg-primary/10');
    });
    modalDropZone.addEventListener('dragleave', () => {
      modalDropZone.classList.remove('border-primary', 'bg-primary/10');
    });
    modalDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      modalDropZone.classList.remove('border-primary', 'bg-primary/10');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) processImageFile(file);
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
    if (editModalAvatarPreview) editModalAvatarPreview.src = currentUser.avatarUrl || DEFAULT_AVATAR;
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
      showToast('Profile details updated successfully!');
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
