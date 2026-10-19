import { Audio } from 'expo-av';

// أصوات الإشعارات المضمّنة. لإضافة صوت جديد: ضع ملف .wav في assets/sounds،
// أضفه هنا وفي app.json (plugins → expo-notifications → sounds) ثم أعد بناء التطبيق.
export const SOUNDS = [
  { id: 'default', name: 'الافتراضي (صوت الجهاز)', file: null },
  { id: 'chime', name: 'رنّة', file: require('../assets/sounds/chime.wav') },
  { id: 'bell', name: 'جرس', file: require('../assets/sounds/bell.wav') },
  { id: 'pop', name: 'فقاعة', file: require('../assets/sounds/pop.wav') },
  { id: 'ding', name: 'دينغ', file: require('../assets/sounds/ding.wav') },
  { id: 'alert', name: 'تنبيه', file: require('../assets/sounds/alert.wav') },
  { id: 'melody', name: 'لحن', file: require('../assets/sounds/melody.wav') },
  { id: 'soft', name: 'هادئ', file: require('../assets/sounds/soft.wav') },
  { id: 'horn', name: 'منبّه', file: require('../assets/sounds/horn.wav') },
];

// أصوات رفعها المالك من جهازه (id = 'custom:<uuid>')
let custom = [];
const listeners = new Set();
export const getCustomSounds = () => custom;
export const onCustomSounds = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export async function loadCustomSounds() {
  try {
    const { supabase } = require('./supabase');
    const { data } = await supabase.from('custom_sounds').select('*').order('created_at', { ascending: false });
    custom = (data || []).map((r) => ({ id: 'custom:' + r.id, rawId: r.id, name: r.name + ' (مرفوع)', url: r.url, path: r.path, push: r.push_sound, custom: true }));
    listeners.forEach((fn) => fn(custom));
  } catch (e) {}
  return custom;
}
export const allSounds = () => [...SOUNDS, ...custom];
export const soundName = (id) => allSounds().find((s) => s.id === id)?.name || id;

let current = null;
export async function playSound(id) {
  let s = allSounds().find((x) => x.id === (id === 'default' || !id ? 'chime' : id));
  if (!s && String(id).startsWith('custom:')) { await loadCustomSounds(); s = allSounds().find((x) => x.id === id); }
  if (!s || (!s.file && !s.url)) return;
  try {
    if (current) await current.unloadAsync();
    const { sound } = await Audio.Sound.createAsync(s.url ? { uri: s.url } : s.file, { shouldPlay: true });
    current = sound;
  } catch (e) {}
}
