import React, { useState, useEffect } from 'react';
import './PersonalGarden.css';
import { API_BASE_URL, apiUrl } from '../config/api';
import { notifyDemoAction } from '../demo/demoNotice';

// ========================
// TYPES
// ========================

interface Post {
  id: string;
  title: string;
  description: string;
  author: string;
  authorInitial: string;
  date: string;
  tags: string[];
  category: 'tips' | 'achievements';
  likes: number;
  comments: any[];
  userLiked?: boolean;
}

interface Task {
  id?: number;
  title: string;
  dueDate: string;
  completed: boolean;
  urgent: boolean;
  description?: string;
}

interface WateringSchedule {
  id?: number;
  plant: string;
  frequency: string;
  amount: string;
  description: string;
}

interface FertilizerSchedule {
  id?: number;
  name: string;
  type: string;
  schedule: string;
  amount: string;
  description: string;
}

interface DiaryEntryType {
  id?: number;
  date: string;
  title: string;
  photo?: string;
  text: string;
}

interface HarvestEntry {
  id?: number;
  date: string;
  amount: number;
}

const transformTaskFromDB = (dbTask: any): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  dueDate: dbTask.due_date,      // ← ВОТ КЛЮЧЕВАЯ СТРОКА!
  completed: Boolean(dbTask.completed),
  urgent: Boolean(dbTask.urgent),
  description: dbTask.description || ''
});

const PersonalGarden: React.FC = () => {
  // ========================
  // STATE - MODALS
  // ========================

  const [mode, setMode] = useState<'personal' | 'community'>('personal');
  const [activeTab, setActiveTab] = useState<'diary' | 'tasks' | 'fertilizer' | 'watering' | 'stats'>('diary');
  const [communityTab, setCommunityTab] = useState<'tips' | 'achievements'>('tips');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showCommunityPostModal, setShowCommunityPostModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showWateringModal, setShowWateringModal] = useState(false);
  const [showFertilizerModal, setShowFertilizerModal] = useState(false);

  // ========================
  // STATE - AI
  // ========================

  const [aiMessage, setAIMessage] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [aiResults, setAIResults] = useState<any>(null);
  const [showAIResultsModal, setShowAIResultsModal] = useState(false);

  // ========================
  // STATE - USER INFO
  // ========================

  const currentUser = 'Вы';
  const currentUserInitial = 'В';

  // ========================
  // STATE - PHOTO
  // ========================

  const [newDiaryPhoto, setNewDiaryPhoto] = useState<File | null>(null);
  const [newDiaryPhotoPreview, setNewDiaryPhotoPreview] = useState<string | null>(null);

  // ========================
  // STATE - FORMS
  // ========================

  const [newTask, setNewTask] = useState({ title: '', dueDate: '', urgent: false, description: '' });
  const [newWatering, setNewWatering] = useState({ plant: '', frequency: '', amount: '', description: '' });
  const [newFertilizer, setNewFertilizer] = useState({ name: '', type: 'минеральное', schedule: '', amount: '', description: '' });
  const [newDiaryEntry, setNewDiaryEntry] = useState({ title: '', text: '' });
  const [newCommunityPost, setNewCommunityPost] = useState({ title: '', description: '', tags: '' });
  const [newHarvestAmount, setNewHarvestAmount] = useState('');

  // ========================
  // STATE - ДАННЫЕ САДА
  // ========================

  const [tasks, setTasks] = useState<Task[]>([]);
  const [wateringSchedule, setWateringSchedule] = useState<WateringSchedule[]>([]);
  const [fertilizerSchedule, setFertilizerSchedule] = useState<FertilizerSchedule[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntryType[]>([]);
  const [harvestHistory, setHarvestHistory] = useState<HarvestEntry[]>([]);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);

  // ========================
  // LOAD DATA FROM DATABASE
  // ========================

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUserId = localStorage.getItem('userId');
        console.log('🔍 Загрузка данных, userId:', storedUserId);
        
        if (!storedUserId) {
          console.warn('⚠️ userId не найден');
          return;
        }
        
        const userId = parseInt(storedUserId, 10);
        const baseUrl = API_BASE_URL;
        
        console.log('📡 Загружаем данные для userId:', userId);
        
        // ✅ ВСЕ запросы параллельно (ДОБАВЬ communityRes!)
        const [tasksRes, wateringRes, fertilizerRes, diaryRes, harvestRes, communityRes] =
          await Promise.all([
            fetch(`${baseUrl}/api/garden/tasks/${userId}`),
            fetch(`${baseUrl}/api/garden/watering/${userId}`),
            fetch(`${baseUrl}/api/garden/fertilizer/${userId}`),
            fetch(`${baseUrl}/api/garden/diary/${userId}`),
            fetch(`${baseUrl}/api/garden/harvest/${userId}`),
            fetch(`${baseUrl}/api/community/posts`), // ← НОВОЕ!
          ]);
        
        console.log('✅ Все запросы выполнены');
        console.log('📊 tasksRes.status:', tasksRes.status);
        
        // Задачи
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const transformed = tasksData.map(transformTaskFromDB);
          setTasks(transformed);
          console.log('📋 Загружено задач:', tasksData.length);
        } else {
          console.error('❌ Ошибка загрузки задач:', tasksRes.status);
        }
        
        // Полив
        if (wateringRes.ok) {
          const wateringData = await wateringRes.json();
          console.log('💧 Загружено расписаний полива:', wateringData.length);
          setWateringSchedule(wateringData);
        }
        
        // Удобрения
        if (fertilizerRes.ok) {
          const fertilizerData = await fertilizerRes.json();
          console.log('🧪 Загружено удобрений:', fertilizerData.length);
          setFertilizerSchedule(fertilizerData);
        }
        
        // Дневник
        if (diaryRes.ok) {
          const diaryData = await diaryRes.json();
          console.log('📝 Загружено записей дневника:', diaryData.length);
          setDiaryEntries(diaryData);
        }
        
        // Урожай
        if (harvestRes.ok) {
          const harvestData = await harvestRes.json();
          console.log('🌾 Загружено записей урожая:', harvestData.length);
          setHarvestHistory(harvestData);
        }
        
        // ✅ Сообщество (НОВОЕ!)
        if (communityRes.ok) {
          const communityData = await communityRes.json();
          console.log('👥 Загружено постов сообщества:', communityData.length);
          
          // Преобразуй формат для фронта
          const formattedPosts = communityData.map((post: any) => ({
            id: post.id.toString(),
            title: post.title,
            description: post.description,
            author: post.author,
            authorInitial: post.author.charAt(0).toUpperCase(),
            date: new Date(post.created_at).toISOString().split('T')[0],
            tags: post.tags || [],
            category: post.category,
            likes: post.likes || 0,
            comments: [],
            userLiked: false,
          }));
          
          setCommunityPosts(formattedPosts);
        }
        
      } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
      }
    };
    
    loadData();
  }, []);
  

  // ========================
  // AI HANDLER
  // ========================

  

  const handleAIRequest = async () => {
    if (!aiMessage.trim()) {
      alert('❌ Введите описание проблемы');
      return;
    }
    notifyDemoAction('message');

    setAILoading(true);
    try {
      const response = await fetch(apiUrl('/api/garden-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: aiMessage,
          gardenContext: { tasks, watering: wateringSchedule, fertilizer: fertilizerSchedule, diaryEntries },
        }),
      });

      const data = await response.json();
      console.log('📦 Ответ от backend:', data);

      if (data.error) throw new Error(data.error);

      const aiTasks: Task[] = (data.tasks || []).map((t: any, i: number) => ({
        id: undefined,
        title: t.title || `Действие ${i + 1}`,
        dueDate: t.dueDate || new Date().toISOString().split('T')[0],
        completed: false,
        urgent: !!t.urgent,
        description: t.description || '',
      }));

      const aiWatering: WateringSchedule[] = (data.watering || []).map((w: any) => ({
        id: undefined,
        plant: w.plant || 'Растение',
        frequency: w.frequency || 'по необходимости',
        amount: w.amount || 'смотри описание',
        description: w.description || '',
      }));

      const aiFertilizer: FertilizerSchedule[] = (data.fertilizer || []).map((f: any, i: number) => ({
        id: undefined,
        name: f.name || `Удобрение ${i + 1}`,
        type: f.type || 'комплексное',
        schedule: f.schedule || 'раз в неделю',
        amount: f.amount || 'смотри описание',
        description: f.description || '',
      }));

      const diaryEntry: DiaryEntryType = {
        id: undefined,
        date: new Date().toISOString().split('T')[0],
        title: data.diaryEntry?.title || '🤖 Анализ от AI',
        text: data.diaryEntry?.text || data.analysis,
      };

      setTasks((prev) => [...prev, ...aiTasks]);
      if (aiWatering.length > 0) setWateringSchedule((prev) => [...prev, ...aiWatering]);
      if (aiFertilizer.length > 0) setFertilizerSchedule((prev) => [...prev, ...aiFertilizer]);
      setDiaryEntries((prev) => [diaryEntry, ...prev]);

      setAIResults({
        analysis: data.analysis,
        tasks: aiTasks,
        watering: aiWatering,
        fertilizer: aiFertilizer,
        diaryEntry: data.diaryEntry,
        tasksCount: aiTasks.length,
        wateringCount: aiWatering.length,
        fertilizerCount: aiFertilizer.length,
      });

      setShowAIResultsModal(true);
      setShowAIModal(false);
      setAIMessage('');
    } catch (error) {
      console.error('Ошибка:', error);
      alert('❌ Ошибка при обработке запроса.\n\nПроверь:\n1. Запущен ли backend на localhost:3001?\n2. Есть ли роут /api/garden-chat?');
    } finally {
      setAILoading(false);
    }
  };

  // ========================
  // TASK HANDLERS
  // ========================

  const addTask = async () => {
    if (!newTask.title || !newTask.dueDate) {
      alert('⚠️ Заполните название и дату');
      return;
    }
  
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0', 10);
      if (!userId) {
        alert('❌ Пожалуйста, авторизуйтесь');
        return;
      }
  
      const payload = {
        userId: userId,
        title: newTask.title.trim(),
        dueDate: newTask.dueDate,
        urgent: newTask.urgent,
        description: newTask.description.trim(),
      };
  
      console.log('📝 Задача:', payload);
  
      const response = await fetch(apiUrl('/api/garden/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`❌ Ошибка: ${error.error || 'Неизвестная ошибка'}`);
        return;
      }
  
      const savedTask = await response.json();
      const transformed = transformTaskFromDB(savedTask)  // ← Трансформируйте!
      setTasks([transformed, ...tasks]);
      setNewTask({ title: '', dueDate: '', urgent: false, description: '' });
      setShowTaskModal(false);
      console.log('✅ Задача сохранена');
  
    } catch (error) {
      console.error('❌ Ошибка:', error);
      alert(`❌ Ошибка: ${(error as Error).message}`);
    }
  };
  
  const toggleTask = async (id: number | undefined) => {
    if (!id) return;
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const response = await fetch(apiUrl(`/api/garden/tasks/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (response.ok) {
        setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
        console.log('✅ Задача обновлена');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
    }
  };

  const deleteTask = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(apiUrl(`/api/garden/tasks/${id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(tasks.filter((t) => t.id !== id));
        console.log('✅ Задача удалена');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
    }
  };

  // ========================
  // WATERING HANDLERS
  // ========================

  const addWatering = async () => {
    if (!newWatering.plant || !newWatering.frequency) {
      alert('⚠️ Заполните растение и частоту');
      return;
    }
  
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0', 10);
      if (!userId) {
        alert('❌ Пожалуйста, авторизуйтесь');
        return;
      }
  
      const response = await fetch(apiUrl('/api/garden/watering'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newWatering }),
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`❌ Ошибка: ${error.error}`);
        return;
      }
  
      const saved = await response.json();
      setWateringSchedule([saved, ...wateringSchedule]);
      setNewWatering({ plant: '', frequency: '', amount: '', description: '' });
      setShowWateringModal(false);
  
    } catch (error) {
      console.error('❌ Ошибка:', error);
    }
  };
  

  const deleteWatering = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(apiUrl(`/api/garden/watering/${id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setWateringSchedule(wateringSchedule.filter((w) => w.id !== id));
        console.log('✅ Полив удален');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
    }
  };

  // ========================
  // FERTILIZER HANDLERS
  // ========================

  const addFertilizer = async () => {
    if (!newFertilizer.name || !newFertilizer.schedule) {
      alert('⚠️ Заполните название и график');
      return;
    }
  
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0', 10);
      if (!userId) {
        alert('❌ Пожалуйста, авторизуйтесь');
        return;
      }
  
      const response = await fetch(apiUrl('/api/garden/fertilizer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newFertilizer }),
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`❌ Ошибка: ${error.error}`);
        return;
      }
  
      const saved = await response.json();
      setFertilizerSchedule([saved, ...fertilizerSchedule]);
      setNewFertilizer({ name: '', type: 'минеральное', schedule: '', amount: '', description: '' });
      setShowFertilizerModal(false);
  
    } catch (error) {
      console.error('❌ Ошибка:', error);
    }
  };
  

  const deleteFertilizer = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(apiUrl(`/api/garden/fertilizer/${id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setFertilizerSchedule(fertilizerSchedule.filter((f) => f.id !== id));
        console.log('✅ Удобрение удалено');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
    }
  };

  // ========================
  // DIARY HANDLERS
  // ========================

  const addDiaryEntry = async () => {
    if (!newDiaryEntry.title.trim() || !newDiaryEntry.text.trim()) {
      alert('⚠️ Заполните название и текст записи');
      return;
    }
  
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('❌ Пожалуйста, авторизуйтесь');
        return;
      }
  
      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber)) {
        alert('❌ Невалидный userId');
        return;
      }
  
      // ✅ Подготовка payload
      const payload = {
        userId: userIdNumber,  // ← Попробуйте ЭТО первым
        // Если не работает, замените на: user_id: userIdNumber,
        title: newDiaryEntry.title.trim(),
        text: newDiaryEntry.text.trim(),
        date: new Date().toISOString().split('T')[0],
      };
  
      console.log('📝 Отправляем:', JSON.stringify(payload, null, 2));
  
      const response = await fetch(apiUrl('/api/garden/diary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      console.log('📊 Status:', response.status);
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Ошибка:', errorData);
        alert(`❌ Ошибка: ${errorData.error || 'Неизвестная ошибка'}`);
        return;
      }
  
      const savedEntry = await response.json();
      console.log('✅ Сохранено:', savedEntry);
  
      setDiaryEntries([{
        id: savedEntry.id,
        date: savedEntry.date || new Date().toISOString().split('T')[0],
        title: savedEntry.title,
        text: savedEntry.text,
        photo: savedEntry.photo_url,
      }, ...diaryEntries]);
  
      setNewDiaryEntry({ title: '', text: '' });
      setNewDiaryPhoto(null);
      setNewDiaryPhotoPreview(null);
      setShowDiaryModal(false);
      alert('✅ Запись сохранена!');
  
    } catch (error) {
      console.error('❌ Ошибка:', error);
      alert(`❌ Ошибка: ${(error as Error).message}`);
    }
  };
  

  // ========================
  // HARVEST HANDLERS
  // ========================

  const addHarvestEntry = async () => {
    if (!newHarvestAmount || parseFloat(newHarvestAmount) <= 0) {
      alert('⚠️ Введите количество урожая');
      return;
    }
  
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0', 10);
      if (!userId) {
        alert('❌ Пожалуйста, авторизуйтесь');
        return;
      }
  
      const response = await fetch(apiUrl('/api/garden/harvest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseFloat(newHarvestAmount),
        }),
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`❌ Ошибка: ${error.error}`);
        return;
      }
  
      const saved = await response.json();
      setHarvestHistory([saved, ...harvestHistory]);
      setNewHarvestAmount('');
      setShowHarvestModal(false);
  
    } catch (error) {
      console.error('❌ Ошибка:', error);
    }
  };
  

  const deleteHarvest = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(apiUrl(`/api/garden/harvest/${id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setHarvestHistory(harvestHistory.filter((h) => h.id !== id));
        console.log('✅ Запись об урожае удалена');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
    }
  };

  // ========================
  // COMMUNITY HANDLERS
  // ========================

  const addCommunityPost = async () => {
    if (!newCommunityPost.title || !newCommunityPost.description) {
      alert('⚠️ Заполните название и описание');
      return;
    }
    notifyDemoAction('message');
  
    try {
      const firstName = localStorage.getItem('firstName') || '';
      const lastName = localStorage.getItem('lastName') || '';
      const username = localStorage.getItem('username') || 'Аноним';
      
      // Используем полное имя или username
      const authorName = (firstName && lastName) 
        ? `${firstName} ${lastName}` 
        : username;
  
      const payload = {
        title: newCommunityPost.title,
        description: newCommunityPost.description,
        author: authorName,
        category: communityTab,
        tags: (newCommunityPost.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
  
      console.log('📝 Отправляем пост:', payload); // ← отладка
  
      const response = await fetch(apiUrl('/api/community/posts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`❌ Ошибка: ${error.error || 'Неизвестная ошибка'}`);
        return;
      }
  
      const savedPost = await response.json();
      
      const newPost: Post = {
        id: savedPost.id.toString(),
        title: savedPost.title,
        description: savedPost.description,
        author: savedPost.author,
        authorInitial: savedPost.author.charAt(0).toUpperCase(),
        date: new Date(savedPost.created_at).toISOString().split('T')[0],
        tags: savedPost.tags || [],
        category: savedPost.category,
        likes: savedPost.likes || 0,
        userLiked: false,
        comments: [],
      };
  
      setCommunityPosts([newPost, ...communityPosts]);
      setNewCommunityPost({ title: '', description: '', tags: '' });
      setShowCommunityPostModal(false);
      console.log('✅ Пост опубликован в сообществе');
  
    } catch (error) {
      console.error('❌ Ошибка:', error);
      alert(`❌ Ошибка: ${(error as Error).message}`);
    }
  };
  
  

  // ========================
  // COMPUTED VALUES
  // ========================

  const totalHarvest = harvestHistory.reduce((sum, entry) => sum + entry.amount, 0);

  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    
    // Парси дату правильно (учитываем UTC сдвиг)
    const taskDate = new Date(t.dueDate);
    const today = new Date();
    
    // Сравниваем только YYYY-MM-DD (игнорируя время)
    const taskDateStr = taskDate.toLocaleDateString('ru-RU');
    const todayStr = today.toLocaleDateString('ru-RU');
    
    console.log(`📅 Сравниваю: "${taskDateStr}" === "${todayStr}"? ${taskDateStr === todayStr}`);
    
    return taskDateStr === todayStr;
  });
  
  
  const weekTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    
    // ✅ Парси дату правильно
    const taskDate = new Date(t.dueDate);
    if (isNaN(taskDate.getTime())) return false; // Проверка на invalid date
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diff = taskDate.getTime() - today.getTime();
    console.log(`📌 "${t.title}": ${t.dueDate} -> ${taskDate.toDateString()}, diff: ${Math.ceil(diff / (1000 * 60 * 60 * 24))} дней`);
    
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });
  
  

  const filteredCommunityPosts = communityPosts.filter((p) => p.category === communityTab);
  // ========================
  // RENDER
  // ========================
  return (
  <div className="personal-garden-app">
    <div className="app-container">
      {/* КНОПКА ПЕРЕКЛЮЧЕНИЯ В ПРАВОМ НИЖНЕМ УГЛУ */}
      <button
        className="mode-toggle-btn"
        onClick={() => setMode(mode === 'personal' ? 'community' : 'personal')}
        title={mode === 'personal' ? 'Перейти в сообщество' : 'Вернуться в личный сад'}
      >
        {mode === 'personal' ? '👥' : '🌱'}
      </button>

      {mode === 'personal' && (
        <>
          <div className="main-content-wrapper">
            <div className="header-section">
              <h1 className="app-title">
                <span className="title-emoji">🌱</span>Мой Личный Сад
              </h1>
            </div>

            {/* 5 ВКЛАДОК */}
            <div className="tabs-container">
              {['diary', 'tasks', 'fertilizer', 'watering', 'stats'].map((tab, idx) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`tab-btn ${activeTab === tab ? 'tab-btn--active' : ''}`}
                >
                  {idx === 0 && '📖 Дневник'}
                  {idx === 1 && '✅ Задачи'}
                  {idx === 2 && '🌿 Удобрения'}
                  {idx === 3 && '💧 Полив'}
                  {idx === 4 && '📊 Статистика'}
                </button>
              ))}
              
              <button
                className="ai-btn"
                onClick={() => setShowAIModal(true)}
              >
                🤖 AI Помощник
              </button>
            </div>

            {/* ВКЛАДКА 1: ДНЕВНИК */}
            {activeTab === 'diary' && (
  <div className="tab-content">
    <div className="content-header">
      <button className="btn-primary" onClick={() => setShowDiaryModal(true)}>
        ➕ Новая запись
      </button>
    </div>
    <div className="cards-list">
      {diaryEntries.length > 0 ? (
        diaryEntries.map(entry => (
          <div key={entry.id} className="diary-card">
            <div className="card-date">📅 {new Date(entry.date).toLocaleDateString('ru-RU')}</div>
            <div className="card-title">{entry.title}</div>
            {entry.photo && (
              <img src={entry.photo} alt="Фото записи" className="diary-photo" />
            )}
            <p className="card-text">{entry.text}</p>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-emoji">📝</div>
          <p>Нет записей</p>
        </div>
      )}
    </div>
  </div>
)}

            {/* ВКЛАДКА 2: ЗАДАЧИ */}
            {activeTab === 'tasks' && (
              <div className="tab-content">
    <div className="content-header">
     
      <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
        ➕ Новая задача
      </button>
    </div>
                <div className="tasks-section">
                  <h3 className="subsection-title">📅 На сегодня ({todayTasks.length})</h3>
                  {todayTasks.length > 0 ? (
                    <div className="tasks-list">
                      {todayTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className="task-item"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}}
                            className="task-checkbox"
                          />
                          <div className="task-content">
                            <div className={`task-title ${task.completed ? 'task-title--completed' : ''}`}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="task-description">{task.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-text">Нет задач на сегодня</div>
                  )}
                </div>

                <div className="tasks-section">
                  <h3 className="subsection-title">📆 На неделю ({weekTasks.length})</h3>
                  {weekTasks.length > 0 ? (
                    <div className="tasks-list">
                      {weekTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className="task-item task-item--week"
                        >
                          <div className="task-content">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => {}}
                              className="task-checkbox"
                            />
                            <div>
                              <div className={`task-title ${task.completed ? 'task-title--completed' : ''}`}>
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="task-description">{task.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="task-date">
                            {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-text">Нет задач на неделю</div>
                  )}
                </div>
              </div>
            )}

            {/* ВКЛАДКА 3: УДОБРЕНИЯ */}
            {activeTab === 'fertilizer' && (
              <div className="tab-content">
          <div className="content-header">
      
      <button className="btn-primary" onClick={() => setShowFertilizerModal(true)}>
        ➕ Добавить удобрение
      </button>
    </div>
                {fertilizerSchedule.length > 0 ? (
                  <div className="cards-list">
                    {fertilizerSchedule.map(f => (
                      <div key={f.id} className="schedule-card schedule-card--fertilizer">
                        <div className="card-title">{f.name}</div>
                        <div className="card-meta">🏷️ {f.type} • {f.schedule}</div>
                        <div className="card-meta">📏 {f.amount}</div>
                        <div className="card-description">{f.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-emoji">🌾</div>
                    <p>Нет удобрений</p>
                  </div>
                )}
              </div>
            )}

            {/* ВКЛАДКА 4: ПОЛИВ */}
            {activeTab === 'watering' && (
              <div className="tab-content">
       <div className="content-header">
      
      <button className="btn-primary" onClick={() => setShowWateringModal(true)}>
        ➕ Добавить режим полива
      </button>
    </div>
                {wateringSchedule.length > 0 ? (
                  <div className="cards-list">
                    {wateringSchedule.map((w, i) => (
                      <div key={i} className="schedule-card schedule-card--watering">
                        <div className="card-title">{w.plant}</div>
                        <div className="card-meta"> {w.frequency} • {w.amount}</div>
                        <div className="card-description">{w.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-emoji">💧</div>
                    <p>Нет режимов полива</p>
                  </div>
                )}
              </div>
            )}

            {/* ВКЛАДКА 5: СТАТИСТИКА */}
            {activeTab === 'stats' && (
              <div className="tab-content">
         <div className="content-header">
      
      <button className="btn-primary" onClick={() => setShowHarvestModal(true)}>
        ➕ Добавить урожай
      </button>
</div>
                <div className="stats-grid">
                  <div className="stat-card stat-card--harvest">
                    <div className="stat-value">{totalHarvest}</div>
                    <div className="stat-label">Урожай за сезон (кг)</div>
                  </div>

                  <div className="stat-card stat-card--days">
                    <div className="stat-value">{harvestHistory.length}</div>
                    <div className="stat-label">Дней сбора</div>
                  </div>

                  <div className="stat-card stat-card--average">
                    <div className="stat-value">{(totalHarvest / harvestHistory.length).toFixed(1)}</div>
                    <div className="stat-label">Среднее в день (кг)</div>
                  </div>
                </div>

                <div className="harvest-header">
                  <h3 className="subsection-title">История сбора урожая</h3>
                 
                </div>

                <div className="harvest-list">
                  {harvestHistory.length > 0 ? (
                    harvestHistory.map((entry, i) => (
                      <div key={i} className="harvest-item">
                        <div className="harvest-date">
                          {new Date(entry.date).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="harvest-amount">+{entry.amount} кг</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-text-centered">Нет записей урожая</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {mode === 'community' && (
        <>
          <div className="main-content-wrapper">
            <div className="header-section">
              <h1 className="app-title">
                <span className="title-emoji">👥</span>Сообщество Садоводов
              </h1>

            </div>

            <div className="community-tabs">
              <button
                onClick={() => setCommunityTab('tips')}
                className={`community-tab-btn ${communityTab === 'tips' ? 'community-tab-btn--active' : ''}`}
              >
                💡 Советы
              </button>
              <button
                onClick={() => setCommunityTab('achievements')}
                className={`community-tab-btn ${communityTab === 'achievements' ? 'community-tab-btn--active' : ''}`}
              >
                🏆 Достижения
              </button>
              <button
                onClick={() => setShowCommunityPostModal(true)}
                className="btn-primary btn-primary--community"
              >
                ➕ Поделиться
              </button>
            </div>

            {filteredCommunityPosts.length > 0 ? (
              <div className="cards-list">
                {filteredCommunityPosts.map(post => (
                  <div key={post.id} className="community-card">
                    <div className="community-card-title">{post.title}</div>
                    <div className="community-card-meta">👤 {post.author} • {post.date}</div>
                    <p className="community-card-text">{post.description}</p>
                    <div className="tags-container">
                      {post.tags.map((tag, i) => (
                        <span key={i} className="tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-emoji">📝</div>
                <p>Нет постов</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* МОДАЛЬНЫЕ ОКНА */}

            {/* МОДАЛКА НОВАЯ ЗАДАЧА */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">➕ Новая задача</h2>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Название</label>
                <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Дата выполнения</label>
                <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" checked={newTask.urgent} onChange={e => setNewTask({...newTask, urgent: e.target.checked})} />
                  Срочная
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Описание (необязательно)</label>
                <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="form-textarea" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTaskModal(false)}>Отмена</button>
              <button className="btn-primary" onClick={addTask}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА НОВЫЙ РЕЖИМ ПОЛИВА */}
      {showWateringModal && (
        <div className="modal-overlay" onClick={() => setShowWateringModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">💧 Новый режим полива</h2>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Растение</label>
                <input type="text" value={newWatering.plant} onChange={e => setNewWatering({...newWatering, plant: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Частота</label>
                <input type="text" placeholder="например: каждый день" value={newWatering.frequency} onChange={e => setNewWatering({...newWatering, frequency: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Объём</label>
                <input type="text" placeholder="например: 1-2 литра" value={newWatering.amount} onChange={e => setNewWatering({...newWatering, amount: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea value={newWatering.description} onChange={e => setNewWatering({...newWatering, description: e.target.value})} className="form-textarea" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowWateringModal(false)}>Отмена</button>
              <button className="btn-primary" onClick={addWatering}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА НОВОЕ УДОБРЕНИЕ */}
      {showFertilizerModal && (
        <div className="modal-overlay" onClick={() => setShowFertilizerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">🌿 Новое удобрение</h2>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Название</label>
                <input type="text" value={newFertilizer.name} onChange={e => setNewFertilizer({...newFertilizer, name: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Тип</label>
                <select value={newFertilizer.type} onChange={e => setNewFertilizer({...newFertilizer, type: e.target.value})} className="form-input">
                  <option value="минеральное">Минеральное</option>
                  <option value="органическое">Органическое</option>
                  <option value="комплексное">Комплексное</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">График</label>
                <input type="text" placeholder="например: каждую неделю" value={newFertilizer.schedule} onChange={e => setNewFertilizer({...newFertilizer, schedule: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Дозировка</label>
                <input type="text" value={newFertilizer.amount} onChange={e => setNewFertilizer({...newFertilizer, amount: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea value={newFertilizer.description} onChange={e => setNewFertilizer({...newFertilizer, description: e.target.value})} className="form-textarea" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowFertilizerModal(false)}>Отмена</button>
              <button className="btn-primary" onClick={addFertilizer}>Добавить</button>
            </div>
          </div>
        </div>
      )}
      {/* AI MODAL */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">🤖 AI Помощник для сада</h2>
            <div className="modal-body">
              <label className="form-label">Ваше описание проблемы</label>
              <textarea
                placeholder="Пример: у меня помидоры болеют, листья желтеют и опадают. Нужна помощь!"
                value={aiMessage}
                onChange={e => setAIMessage(e.target.value)}
                className="form-textarea"
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowAIModal(false)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleAIRequest}
                disabled={aiLoading}
                className={`btn-primary ${aiLoading ? 'btn-primary--loading' : ''}`}
              >
                {aiLoading ? '⏳ Обработка...' : '🤖 Получить рекомендации'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* РЕЗУЛЬТАТЫ AI MODAL */}
      {showAIResultsModal && (
  <div className="modal-overlay" onClick={() => setShowAIResultsModal(false)}>
    <div 
      className="modal ai-analysis-modal" 
      onClick={e => e.stopPropagation()}
    >
      {/* Заголовок */}
      <h2 className="modal-title">Анализ от AI</h2>

      {/* Основное содержимое */}
      <div className="modal-body">
        <div className="ai-analysis-content">

          {/* 1. АНАЛИЗ */}
          <section className="ai-analysis-section">
            <h3 className="ai-analysis-section__title">
              🔍 Анализ проблемы
            </h3>
            <p className="ai-analysis-section__content">
              {aiResults?.analysis || 'Нет данных анализа'}
            </p>
          </section>

          {/* 2. ЗАДАЧИ */}
          {aiResults?.tasks && aiResults.tasks.length > 0 && (
            <section className="ai-analysis-section ai-tasks-section">
              <h3 className="ai-analysis-section__title">
                Рекомендуемые задачи
              </h3>
              <div className="ai-tasks-list">
                {aiResults.tasks.map((task: any, index: number) => (
                  <div key={index} className="ai-task-item">
                    <div className="ai-task-title">
                      {task.title}
                      {task.urgent && <span className="ai-task-urgent">Срочно!</span>}
                    </div>
                    {task.dueDate && (
                      <div className="ai-task-due">
                        До: {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                    <div className="ai-task-description">
                      {task.description}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. ПОЛИВ */}
          {aiResults?.watering && aiResults.watering.length > 0 && (
            <section className="ai-analysis-section ai-watering-section">
              <h3 className="ai-analysis-section__title">
                Режимы полива
              </h3>
              <div className="ai-watering-list">
                {aiResults.watering.map((item: any, index: number) => (
                  <div key={index} className="ai-watering-item">
                    <div className="ai-watering-plant">{item.plant}</div>
                    <div className="ai-watering-details">
                      <strong>Частота:</strong> {item.frequency}<br />
                      <strong>Объём:</strong> {item.amount}<br />
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. УДОБРЕНИЯ */}
          {aiResults?.fertilizer && aiResults.fertilizer.length > 0 && (
            <section className="ai-analysis-section ai-fertilizer-section">
              <h3 className="ai-analysis-section__title">
                Рекомендуемые удобрения
              </h3>
              <div className="ai-fertilizer-list">
                {aiResults.fertilizer.map((item: any, index: number) => (
                  <div key={index} className="ai-fertilizer-item">
                    <div className="ai-fertilizer-name">
                      {item.name}
                      <span className="ai-fertilizer-type">{item.type}</span>
                    </div>
                    <div className="ai-fertilizer-details">
                      <strong>График:</strong> {item.schedule}<br />
                      <strong>Дозировка:</strong> {item.amount}<br />
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. ЗАПИСЬ В ДНЕВНИК */}
          {aiResults?.diaryEntry && (
            <section className="ai-analysis-section ai-diary-section">
              <h3 className="ai-analysis-section__title">
                Запись в дневник сада
              </h3>
              <div className="ai-diary-entry">
                <div className="ai-diary-title">
                  {aiResults.diaryEntry.title}
                </div>
                <div className="ai-diary-text">
                  {aiResults.diaryEntry.text}
                </div>
              </div>
            </section>
          )}

          {/* Если ничего нет — заглушка */}
          {(!aiResults?.tasks?.length && !aiResults?.watering?.length && !aiResults?.fertilizer?.length && !aiResults?.diaryEntry) && (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Рекомендаций не найдено
            </p>
          )}
        </div>
      </div>

      {/* Футер с кнопкой */}
      <div className="modal-footer">
        <button
          onClick={() => setShowAIResultsModal(false)}
          className="btn-primary"
        >
          ✅ Готово
        </button>
      </div>
    </div>
  </div>
)}

      {/* ДНЕВНИК MODAL */}
     {showDiaryModal && (
  <div className="modal-overlay" onClick={() => setShowDiaryModal(false)}>
    <div className="modal modal--diary" onClick={e => e.stopPropagation()}>
      <h2 className="modal-title">📖 Новая запись в дневник</h2>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Тема</label>
          <input
            type="text"
            placeholder="Введите тему записи..."
            value={newDiaryEntry.title}
            onChange={e => setNewDiaryEntry({ ...newDiaryEntry, title: e.target.value })}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea
            placeholder="Напишите подробно о том, что произошло в саду..."
            value={newDiaryEntry.text}
            onChange={e => setNewDiaryEntry({ ...newDiaryEntry, text: e.target.value })}
            className="form-textarea"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Фото</label>
          <label className="file-upload-btn">
            📷 Выбрать фото
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  notifyDemoAction('photo');
                  setNewDiaryPhoto(file);
                  setNewDiaryPhotoPreview(URL.createObjectURL(file));
                }
              }}
              className="hidden-file-input"
            />
          </label>
          {newDiaryPhotoPreview && (
            <div className="photo-preview">
              <img src={newDiaryPhotoPreview} alt="Превью фото" />
              <button
                className="remove-photo-btn"
                onClick={() => {
                  setNewDiaryPhoto(null);
                  setNewDiaryPhotoPreview(null);
                }}
              >
                ✕ Удалить
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-secondary" onClick={() => setShowDiaryModal(false)}>
          Отмена
        </button>
        <button className="btn-primary" onClick={addDiaryEntry}>
          Сохранить
        </button>
      </div>
    </div>
  </div>
)}

      {/* УРОЖАЙ MODAL */}
      {showHarvestModal && (
        <div className="modal-overlay" onClick={() => setShowHarvestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">🌽 Добавить урожай</h2>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Количество урожая (кг)</label>
                <input
                  type="number"
                  placeholder="Введите количество килограмм..."
                  value={newHarvestAmount}
                  onChange={e => setNewHarvestAmount(e.target.value)}
                  min="0"
                  step="0.5"
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowHarvestModal(false)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={addHarvestEntry}
                className="btn-primary"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMUNITY POST MODAL */}
      {showCommunityPostModal && (
        <div className="modal-overlay" onClick={() => setShowCommunityPostModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">✨ Поделиться в сообществе</h2>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Заголовок</label>
                <input
                  type="text"
                  placeholder="Введите заголовок..."
                  value={newCommunityPost.title}
                  onChange={e => setNewCommunityPost({ ...newCommunityPost, title: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  placeholder="Расскажите о вашем опыте или достижении..."
                  value={newCommunityPost.description}
                  onChange={e => setNewCommunityPost({ ...newCommunityPost, description: e.target.value })}
                  className="form-textarea"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Теги (через запятую)</label>
                <input
                  type="text"
                  placeholder="огурцы, урожай, совет"
                  value={newCommunityPost.tags}
                  onChange={e => setNewCommunityPost({ ...newCommunityPost, tags: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowCommunityPostModal(false)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={addCommunityPost}
                className="btn-primary"
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PersonalGarden;
