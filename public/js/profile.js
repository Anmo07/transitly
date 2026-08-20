/**
 * Transitly — Profile Hub Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileTrips = document.getElementById('profileTrips');
  const profileAvatar = document.getElementById('profileAvatar');
  const btnEditProfile = document.getElementById('btnEditProfile');
  const editProfileModal = document.getElementById('editProfileModal');
  const btnCloseEditProfile = document.getElementById('btnCloseEditProfile');
  const editProfileForm = document.getElementById('editProfileForm');
  const editName = document.getElementById('editName');
  const editEmail = document.getElementById('editEmail');
  const editPhone = document.getElementById('editPhone');

  // Load profile
  async function loadProfile() {
    try {
      const res = await fetch('/api/v1/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      
      const user = data.data.user;
      const stats = data.data.stats;

      profileName.textContent = user.name;
      profileEmail.textContent = user.email;
      profileAvatar.src = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0066FF&color=fff`;
      profileTrips.textContent = `(${stats.totalTrips} trips)`;

      // Populate edit form
      editName.value = user.name;
      editEmail.value = user.email;
      editPhone.value = user.phone || '';
    } catch (err) {
      console.error(err);
      profileName.textContent = 'Guest User';
      profileEmail.textContent = 'Not logged in';
    }
  }

  await loadProfile();

  // Edit Modal Toggles
  btnEditProfile?.addEventListener('click', () => {
    editProfileModal.classList.remove('hidden');
    editProfileModal.classList.add('flex');
  });

  btnCloseEditProfile?.addEventListener('click', () => {
    editProfileModal.classList.add('hidden');
    editProfileModal.classList.remove('flex');
  });

  // Handle Edit Submission
  editProfileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = editProfileForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.value,
          email: editEmail.value,
          phone: editPhone.value
        })
      });

      if (!res.ok) throw new Error('Failed to update profile');
      await loadProfile();
      btnCloseEditProfile.click();
    } catch (err) {
      alert(err.message);
    } finally {
      submitBtn.textContent = 'Save Changes';
      submitBtn.disabled = false;
    }
  });

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      alert('Session ended. Successfully logged out.');
    });
  }
});
