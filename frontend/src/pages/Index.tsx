import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';

const Index = () => {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);

  useEffect(() => {
    navigate(user ? '/dashboard' : '/login');
  }, [user, navigate]);

  return null;
};

export default Index;
