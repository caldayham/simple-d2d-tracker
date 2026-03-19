import { getResultTags } from '@/actions/settings';
import { ResultTagsEditor } from '@/components/settings/ResultTagsEditor';

export default async function SettingsPage() {
  const resultTags = await getResultTags();

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-white mb-6">Settings</h1>

      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
          Visit Result Tags
        </h2>
        <ResultTagsEditor initialTags={resultTags} />
      </section>
    </div>
  );
}
