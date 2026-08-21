import { createContext, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { requestForToken } from '../firebase';
import apiClient from '../api/axiosClient';

export const FCMContext = createContext();

export const FCMProvider = ({ children }) => {
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            // Register FCM push token exactly once per login session
            requestForToken()
                .then(token => {
                    if (token) {
                        apiClient.put('/auth/fcm-token', { token })
                            .then(() => console.log('FCM token synced.'))
                            .catch(err => console.error('FCM token sync failed:', err));
                    }
                })
                .catch(err => console.warn('FCM token request failed:', err));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <FCMContext.Provider value={{}}>
            {children}
        </FCMContext.Provider>
    );
};
