import demoData from './demo-data.json';
import { DEMO_MODE } from '../config/api';

type CollectionName = 'tasks' | 'watering' | 'fertilizer' | 'diary' | 'harvest' | 'community';
type DemoState = typeof demoData;

const STORAGE_KEY = 'floromate_demo_data_v1';

const cloneSeed = (): DemoState => JSON.parse(JSON.stringify(demoData));

const loadState = (): DemoState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : cloneSeed();
  } catch {
    return cloneSeed();
  }
};

let state = loadState();

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const requestBody = async (request: Request): Promise<any> => {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return {};
  try {
    return await request.clone().json();
  } catch {
    return {};
  }
};

const collectionFor = (pathname: string): CollectionName | null => {
  if (pathname.includes('/garden/tasks')) return 'tasks';
  if (pathname.includes('/garden/watering')) return 'watering';
  if (pathname.includes('/garden/fertilizer')) return 'fertilizer';
  if (pathname.includes('/garden/diary')) return 'diary';
  if (pathname.includes('/garden/harvest')) return 'harvest';
  if (pathname.includes('/community/posts')) return 'community';
  return null;
};

const handleCollection = async (request: Request, pathname: string, collection: CollectionName) => {
  const list = state.garden[collection] as any[];
  const id = Number(pathname.split('/').pop());
  if (request.method === 'GET') return json(list);
  if (request.method === 'DELETE') {
    (state.garden[collection] as any[]) = list.filter(item => item.id !== id);
    save();
    return json({ success: true });
  }
  const body = await requestBody(request);
  if (request.method === 'PUT') {
    const item = list.find(entry => entry.id === id);
    if (item) Object.assign(item, body);
    save();
    return json(item || { error: 'Запись не найдена' }, item ? 200 : 404);
  }
  const created = {
    ...body,
    id: Math.max(0, ...list.map(item => Number(item.id))) + 1,
    ...(collection === 'tasks' && { due_date: body.dueDate, completed: false }),
    ...(collection === 'community' && { likes: 0, created_at: new Date().toISOString() }),
    ...(collection === 'harvest' && { date: new Date().toISOString().slice(0, 10) }),
  };
  list.unshift(created);
  save();
  return json(created, 201);
};

const handleDemoRequest = async (request: Request): Promise<Response> => {
  const url = new URL(request.url, window.location.origin);
  const path = url.pathname;

  const collection = collectionFor(path);
  if (collection) return handleCollection(request, path, collection);

  if (path === '/api/plants' || path === '/api/plants/') {
    const colors = (url.searchParams.get('colors') || '').split(',').filter(Boolean);
    const habitats = (url.searchParams.get('habitats') || '').split(',').filter(Boolean);
    const sizes = (url.searchParams.get('sizes') || '').split(',').filter(Boolean);
    const plants = state.plants.filter(plant =>
      (!colors.length || colors.includes(plant.color)) &&
      (!habitats.length || habitats.includes(plant.habitat)) &&
      (!sizes.length || sizes.includes(plant.size))
    );
    return json({ plants, totalPages: 1, total: plants.length });
  }
  if (path === '/api/plants/search') {
    const query = (url.searchParams.get('query') || '').toLocaleLowerCase('ru');
    return json(state.plants.filter(plant =>
      `${plant.name} ${plant.scientificName}`.toLocaleLowerCase('ru').includes(query)
    ));
  }
  if (/^\/api\/plants\/\d+$/.test(path)) {
    const plant = state.plants.find(item => item.id === Number(path.split('/').pop()));
    return json(plant || { error: 'Растение не найдено' }, plant ? 200 : 404);
  }
  if (path === '/api/plants/photo') return json({ image: state.plants[0].image });
  if (path === '/api/plants/enrich') return json({ enriched: true, data: state.plants[0] });
  if (path === '/api/plants/recognize') return json({ success: true, plant: state.plants[0] }, 201);
  if (path === '/api/identify') return json({
    results: [{
      species: { commonNames: ['Монстера'], scientificNameWithoutAuthor: 'Monstera deliciosa' },
      genus: { scientificNameWithoutAuthor: 'Monstera' },
      family: { scientificNameWithoutAuthor: 'Araceae' },
      score: 0.94
    }]
  });
  if (path === '/api/disease-detect') return json({
    is_healthy: false,
    is_healthy_probability: 0.18,
    diseases: [{ name: 'Недостаток влаги', probability: 0.82, description: 'Края листьев подсыхают.', treatment: 'Нормализуйте полив и влажность воздуха.' }],
    best_match: { disease_name: 'Недостаток влаги', confidence: 0.82, severity: 'Низкая', description: 'Края листьев подсыхают.', treatment: 'Нормализуйте полив и влажность воздуха.' }
  });
  if (path === '/api/landscape/generate') return json({ imageUrl: '/imagebag.jpg' });
  if (path === '/api/chat') return json({ response: 'В деморежиме советую проверить влажность грунта, освещение и состояние листьев. Для монстеры поливайте после подсыхания верхнего слоя почвы.' });
  if (path === '/api/garden-chat') return json({
    analysis: 'Растения выглядят стабильно. На этой неделе стоит проверить влажность почвы и удалить сухие листья.',
    tasks: [{ title: 'Проверить влажность грунта', dueDate: new Date().toISOString().slice(0, 10), urgent: false, description: 'Проверить грунт на глубине 3 см' }],
    watering: [], fertilizer: [],
    diaryEntry: { title: 'Демо-анализ сада', text: 'Состояние сада стабильное.' }
  });
  if (path === '/api/feedback' && request.method === 'GET') return json(state.feedback);
  if (path === '/api/feedback' && request.method === 'POST') return json({ message: 'Спасибо! Отзыв сохранён локально в деморежиме.' }, 201);
  if (path === '/api/subscription/upgrade') {
    const body = await requestBody(request);
    return json({ user: { subscription: { type: body.subscriptionType, dailyRequests: 100, usedRequests: 0 } } });
  }
  if (path === '/api/auth/login') return json({ user: { id: 9001, first_name: 'Демо', last_name: 'Садовод', username: 'demo', phone: '+70000000000', subscription: { type: 'pro_ultra', dailyRequests: 100, usedRequests: 0 } } });
  if (path.startsWith('/api/auth/')) return json({ success: true, message: 'Демо-операция выполнена', available: true });
  if (path === '/api/health') return json({ status: 'ok', mode: 'demo' });

  return json({ error: `Демо-ответ для ${path} не настроен` }, 404);
};

export const installDemoApi = () => {
  if (!DEMO_MODE) return;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const normalizedInput =
      typeof input === 'string' ? new URL(input, window.location.origin).toString() : input;
    const request = new Request(normalizedInput, init);
    const url = new URL(request.url, window.location.origin);
    return url.pathname.startsWith('/api/') ? handleDemoRequest(request) : nativeFetch(input, init);
  };
};
