import apiClient from './apiClient';

class UserService {
  getProfile() {
    return apiClient.get('/users/profile');
  }

  updateProfile(userData) {
    return apiClient.put('/users/profile', userData);
  }

  updatePassword(currentPassword, newPassword) {
    return apiClient.put('/users/password', {
      currentPassword,
      newPassword
    });
  }

  uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return apiClient.post('/users/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  deleteAccount() {
    return apiClient.delete('/users/account');
  }

  getBookingHistory() {
    return apiClient.get('/users/booking-history');
  }

  getFavoriteVehicles() {
    return apiClient.get('/users/favorites');
  }

  addToFavorites(vehicleId) {
    return apiClient.post('/users/favorites', { vehicleId });
  }

  removeFromFavorites(vehicleId) {
    return apiClient.delete(`/users/favorites/${vehicleId}`);
  }

  getWalletBalance() {
    return apiClient.get('/users/wallet/balance');
  }

  addWalletBalance(amount) {
    return apiClient.post('/users/wallet/add', { amount });
  }

  getSavedPassengers() {
    return apiClient.get('/users/passengers');
  }

  addSavedPassenger(passengerData) {
    return apiClient.post('/users/passengers', passengerData);
  }

  updateSavedPassenger(passengerId, passengerData) {
    return apiClient.put(`/users/passengers/${passengerId}`, passengerData);
  }

  deleteSavedPassenger(passengerId) {
    return apiClient.delete(`/users/passengers/${passengerId}`);
  }
}

export const userService = new UserService();
export default userService;