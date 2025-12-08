import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Ideally check validity with backend, for now decode or trust if valid
                    // We can store user info in localStorage too to avoid extra call, or decode JWT
                    // Let's decode properly if we had a library, or just trust persistence for now
                    const storedUser = JSON.parse(localStorage.getItem('user'));
                    if (storedUser) {
                        setUser(storedUser);
                        // Set Auth Header Global
                        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('http://localhost:5001/api/auth/login', { email, password });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(user);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error.response?.data);
            return { success: false, msg: error.response?.data?.msg || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    // Quick Register wrapper if needed, or component handles it
    const register = async (userData) => {
        try {
            const res = await axios.post('http://localhost:5001/api/auth/register', userData);
            // Auto login after register? Or just return success
            return { success: true, token: res.data.token };
        } catch (error) {
            return { success: false, msg: error.response?.data?.msg || 'Registration failed' };
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
