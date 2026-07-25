import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { setUser } from '../../store/authSlice';
import { apiUrl } from '../../config/api';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'login' | 'register' | 'resetPassword';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialType = 'login' }) => {
  const dispatch = useAppDispatch();

  const [formType, setFormType] = useState<'login' | 'register' | 'verify' | 'resetPassword' | 'resetVerify' | 'newPassword'>(initialType);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '+7',
    password: '',
    confirmPassword: '',
  });
  
  const [verificationCode, setVerificationCode] = useState('');
  const [displayCode, setDisplayCode] = useState('');
  const [phoneToVerify, setPhoneToVerify] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormType(initialType);
    }
  }, [isOpen, initialType]);
  

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsResendDisabled(false);
    }
  }, [resendTimer]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    
    if (value === '') {
      setFormData({ ...formData, phone: '+7' });
      return;
    }

    if (!value.startsWith('7')) {
      value = '7' + value;
    }

    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    setFormData({ ...formData, phone: '+' + value });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      handlePhoneChange(e);
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (formType === 'login') {
        if (!formData.username || !formData.password) {
          setError('Пожалуйста, заполните все поля');
          setIsLoading(false);
          return;
        }

        const response = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.username, password: formData.password }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Ошибка при входе' }));
          setError(typeof errorData.error === 'string' ? errorData.error : 'Ошибка при входе');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        localStorage.setItem('userId', data.user.id.toString());
        localStorage.setItem('username', data.user.username); // ← ДОБАВЬ ЭТО!
        localStorage.setItem('firstName', data.user.first_name); // Опционально
        localStorage.setItem('lastName', data.user.last_name); // Опционально
        dispatch(setUser(data.user));
        setSuccess('Вход выполнен успешно!');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1000);
        
      } else if (formType === 'register') {
        if (!formData.firstName || !formData.lastName || !formData.username ||
            !formData.phone || !formData.password || !formData.confirmPassword) {
          setError('Пожалуйста, заполните все поля');
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Пароли не совпадают');
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Пароль должен содержать минимум 6 символов');
          setIsLoading(false);
          return;
        }

        // Отправляем код верификации
        const response = await fetch(apiUrl('/api/auth/send-verification'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone: formData.phone, 
            isPasswordReset: false
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || 'Ошибка отправки кода');
          setIsLoading(false);
          return;
        }

        setPhoneToVerify(formData.phone);
        setDisplayCode(data.code);
        setFormType('verify');
        startResendTimer();
        
      } else if (formType === 'resetPassword') {
        if (!formData.phone) {
          setError('Пожалуйста, введите номер телефона');
          setIsLoading(false);
          return;
        }

        const response = await fetch(apiUrl('/api/auth/send-verification'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formData.phone, isPasswordReset: true }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Ошибка отправки кода' }));
          setError(typeof errorData.error === 'string' ? errorData.error : 'Ошибка отправки кода');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setPhoneToVerify(formData.phone);
        setFormType('resetVerify');
        startResendTimer();
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (verificationCode.length !== 6) {
        setError('Код должен содержать 6 цифр');
        setIsLoading(false);
        return;
      }

      if (formType === 'verify') {
        const response = await fetch(apiUrl('/api/auth/verify-code'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phoneToVerify,
            code: verificationCode,
            userData: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              username: formData.username,
              password: formData.password,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(typeof data.error === 'string' ? data.error : 'Ошибка при верификации');
          setIsLoading(false);
          return;
        }

        dispatch(setUser(data.user));
        setSuccess('Регистрация успешна!');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1000);
        
      } else if (formType === 'resetVerify') {
        setFormType('newPassword');
        setSuccess('');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.password || !formData.confirmPassword) {
        setError('Пожалуйста, заполните оба поля');
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают');
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов');
        setIsLoading(false);
        return;
      }

      const response = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneToVerify,
          code: verificationCode,
          newPassword: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка при сбросе пароля' }));
        setError(typeof errorData.error === 'string' ? errorData.error : 'Ошибка при сбросе пароля');
        setIsLoading(false);
        return;
      }

      setSuccess('Пароль успешно изменён!');
      setTimeout(() => {
        onClose();
        resetForm();
        setFormType('login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isResendDisabled) return;
    
    try {
      const response = await fetch(apiUrl('/api/auth/send-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneToVerify, 
          isPasswordReset: formType === 'resetVerify'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setDisplayCode(data.code);
        setSuccess(`Новый код: ${data.code}`);
        startResendTimer();
      }
    } catch (err) {
      console.error('Ошибка повторной отправки:', err);
    }
  };

  const startResendTimer = () => {
    setIsResendDisabled(true);
    setResendTimer(60);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      phone: '+7',
      password: '',
      confirmPassword: '',
    });
    setVerificationCode('');
    setDisplayCode('');
    setPhoneToVerify('');
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* ✅ КРЕСТИК ДЛЯ ЗАКРЫТИЯ */}
        <button 
          className="auth-modal__close" 
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <form className="auth-form" onSubmit={
          formType === 'verify' || formType === 'resetVerify' 
            ? handleVerification 
            : formType === 'newPassword'
            ? handleNewPassword
            : handleSubmit
        }>
          <h2>
            {formType === 'login' && 'Вход'}
            {formType === 'register' && 'Регистрация'}
            {(formType === 'verify' || formType === 'resetVerify') && 'Подтверждение'}
            {formType === 'resetPassword' && 'Восстановление пароля'}
            {formType === 'newPassword' && 'Новый пароль'}
          </h2>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          {formType === 'login' && (
            <>
              <div>
                <label>Имя пользователя</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label>Пароль</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Загрузка...' : 'Войти'}
              </button>

              <p onClick={() => setFormType('resetPassword')} style={{ cursor: 'pointer', color: 'var(--color-primary)', marginTop: '10px' }}>
                Забыли пароль?
              </p>

              <p>
                Нет аккаунта?{' '}
                <span onClick={() => setFormType('register')} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
                  Зарегистрируйся
                </span>
              </p>
            </>
          )}

          {formType === 'register' && (
            <>
              <div>
                <label>Имя</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
              </div>

              <div>
                <label>Фамилия</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </div>

              <div>
                <label>Имя пользователя</label>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required />
              </div>

              <div>
                <label>Номер телефона</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (___) ___-__-__"
                  required
                />
              </div>

              <div>
                <label>Пароль</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>

              <div>
                <label>Подтвердите пароль</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
              </button>

              <p>
                Уже есть аккаунт?{' '}
                <span onClick={() => setFormType('login')} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
                  Войти
                </span>
              </p>
            </>
          )}

          {(formType === 'verify' || formType === 'resetVerify') && (
            <>

              <div>
                <label>Введите код</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) setVerificationCode(value);
                  }}
                  placeholder="______"
                  maxLength={6}
                  className="verification-input"
                  required
                />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Загрузка...' : 'Подтвердить'}
              </button>

              <p style={{ textAlign: 'center' }}>
                Не получили код?{' '}
                <span
                  onClick={handleResendCode}
                  style={{ 
                    cursor: isResendDisabled ? 'not-allowed' : 'pointer', 
                    color: isResendDisabled ? 'var(--color-text-secondary)' : 'var(--color-primary)' 
                  }}
                >
                  {isResendDisabled ? `Отправить повторно (${resendTimer}с)` : 'Отправить повторно'}
                </span>
              </p>
            </>
          )}

          {formType === 'resetPassword' && (
            <>
              <p style={{ marginBottom: '15px', color: 'var(--color-text-secondary)' }}>
                Введите номер телефона, привязанный к вашему аккаунту
              </p>

              <div>
                <label>Номер телефона</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (___) ___-__-__"
                  required
                />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Загрузка...' : 'Отправить код'}
              </button>

              <p>
                Вспомнили пароль?{' '}
                <span onClick={() => setFormType('login')} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
                  Войти
                </span>
              </p>
            </>
          )}

          {formType === 'newPassword' && (
            <>
              <div>
                <label>Новый пароль</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>

              <div>
                <label>Подтвердите пароль</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Загрузка...' : 'Изменить пароль'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
