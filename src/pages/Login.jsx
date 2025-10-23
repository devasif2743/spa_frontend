import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
import { Store, User, Lock, Eye, EyeOff } from 'lucide-react';
import {loginWeb} from '../contexts/authApi';
// import logo from '../images/logo.jpeg';
import logo from "../public/images/logo.png";

const Login = () => {
  // const { user, login } = useAuth();
  const location = useLocation();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';
  const storedUser = JSON.parse(localStorage.getItem("user_details") || "null");
if (storedUser) {
  // Only allow admin or manager
  if (storedUser.role === 'admin' || storedUser.role === 'manager') {
    const redirectPath = storedUser.role === 'admin' ? '/admin' : '/manager';
    return <Navigate to={from === '/' ? redirectPath : from} replace />;
  } else {
    // For any other role, redirect to login (or show an error)
    return <Navigate to="/login" replace />;
  }
}


//  const handleSubmit = async (e) => {
//   e.preventDefault();
//   setError('');
//   setLoading(true);

//   try {
//     const result = await login(credentials);  // <-- await here

//     if (result.success) {
//       const redirectPath =
//         result.user.role === 'admin' ? '/admin' :
//         result.user.role === 'manager' ? '/manager' : '/pos';

//       // Instead of full reload, better to use Navigate or useNavigate()
//       window.location.href = from === '/' ? redirectPath : from;
//     } else {
//       setError(result.error || "Invalid credentials");
//     }
//   } catch (err) {
//     console.error("Login failed:", err);
//     setError("Something went wrong. Please try again.");
//   } finally {
//     setLoading(false);
//   }
// };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const res = await loginWeb(credentials);
    console.log("Login response:", res);

    if (res.data.status) {
      const user = res.data.user; // assuming API returns user object with role
      console.log("ssss",user);
      // ✅ Allow only admin or manager
      if (user.role === 'admin' || user.role === 'manager') {
        // Save token + user details
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("user_details", JSON.stringify(user));

        const redirectPath =
          user.role === 'admin' ? '/admin' : '/manager';

        // Redirect
        window.location.href = from === '/' ? redirectPath : from;
      } else {
        // ❌ Any other role: show error or send back to login
        setError("Only admin or manager accounts are allowed.");
      }
    } else {
      setError(res.data.message || "Invalid credentials");
    }
  } catch (err) {
    console.error("Login error:", err);
    setError(err.response?.data?.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};


  // const demoCredentials = [
  //   { username: 'admin', password: 'admin123', role: 'Admin' },
  //   { username: 'manager1', password: 'manager123', role: 'Branch Manager' },
  //   { username: 'pos1', password: 'pos123', role: 'POS User' }
  // ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">

            </div>

               <div className="flex justify-center mb-4">
              <img
                src={logo}
                alt="OdySpa Logo"
                className="h-16 w-auto object-contain"
              />
            </div>


            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Spa Software 
            </h1>
            <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
              
          {/* <div className="mt-8 border-t pt-6 d-none">
            <p className="text-sm text-gray-600 mb-4 text-center">Demo Credentials:</p>
            <div className="space-y-2">
              {demoCredentials.map((cred, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{cred.role}</span>
                    <button
                      type="button"
                      onClick={() => setCredentials({ username: cred.username, password: cred.password })}
                      className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                    >
                      Use Credentials
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {cred.username} / {cred.password}
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;