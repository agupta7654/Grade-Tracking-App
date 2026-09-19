import { useStore } from './lib/store';
import { useCloudSync } from './lib/useCloudSync';
import { useRoute } from './lib/route';
import Home from './components/Home';
import CourseView from './components/CourseView';
import ImportView from './components/ImportView';
import SettingsView from './components/SettingsView';

export default function App() {
  const { data, update, replaceAll, updatedAt, adoptRemote } = useStore();
  const sync = useCloudSync({ data, updatedAt, adoptRemote });
  const [page, id] = useRoute();
  const course = data.courses.find((c) => c.id === id);

  if (page === 'settings') return <SettingsView data={data} replaceAll={replaceAll} sync={sync} />;
  if (page === 'course' && course) return <CourseView course={course} update={update} />;
  if (page === 'import' && course) return <ImportView course={course} update={update} />;
  return <Home courses={data.courses} update={update} />;
}
