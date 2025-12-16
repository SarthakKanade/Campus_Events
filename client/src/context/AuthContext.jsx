import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem('token');
                    setUser(null);
                } else {
                    setUser({ ...decoded, token }); // Assuming payload has name/role/id
                    // Optional: Validate with backend
                }
            } catch (e) {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            const { token } = res.data;
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser({ ...decoded, token });
            toast.success("Welcome back!");
            return { success: true };
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.msg || "Login failed";
            toast.error(msg);
            return { success: false, msg };
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post('/api/auth/register', userData);
            const { token } = res.data;
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser({ ...decoded, token });
            toast.success("Account created! Welcome to the chill zone.");
            return true;
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.msg || "Registration failed";
            toast.error(msg);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        toast.info("Logged out");
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
