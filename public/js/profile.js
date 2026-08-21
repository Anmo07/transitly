/**
 * Transitly — Profile Controller
 * Connected with backend REST API (/api/v1/profile)
 */

document.addEventListener('DOMContentLoaded', () => {
  const profileUserName = document.getElementById('profileUserName');
  const profileUserEmail = document.getElementById('profileUserEmail');
  const profileUserPhone = document.getElementById('profileUserPhone');
  const profileTripsCount = document.getElementById('profileTripsCount');

  const btnOpenEditProfileModal = document.getElementById('btnOpenEditProfileModal');
  const editProfileModal = document.getElementById('editProfileModal');
  const btnCloseEditProfileModal = document.getElementById('btnCloseEditProfileModal');
  const btnCancelEditProfile = document.getElementById('btnCancelEditProfile');
  const formEditProfile = document.getElementById('formEditProfile');

  const inputProfileName = document.getElementById('inputProfileName');
  const inputProfileEmail = document.getElementById('inputProfileEmail');
  const inputProfilePhone = document.getElementById('inputProfilePhone');

  const btnLogoutProfile = document.getElementById('btnLogoutProfile');

  let currentUser = {
    name: 'Alex Mitchell',
    email: 'alex.mitchell@example.com',
    phone: '+91 98765 43210'
  };

  /**
   * Fetch profile from backend
   */
  const loadProfile = async () => {
    try {
      const res = await fetch('/api/v1/profile');
      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        if (data.user) {
          currentUser = {
            name: data.user.name || currentUser.name,
            email: data.user.email || currentUser.email,
            phone: data.user.phone || currentUser.phone
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
  };

  /**
   * Edit Profile Modal Handlers
   */
  const openModal = () => {
    if (!editProfileModal) return;
    inputProfileName.value = currentUser.name;
    inputProfileEmail.value = currentUser.email;
    inputProfilePhone.value = currentUser.phone;
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
        phone: inputProfilePhone.value.trim()
      };

      try {
        await fetch('/api/v1/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (_) {}

      currentUser = updated;
      renderProfile();
      closeModal();
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
