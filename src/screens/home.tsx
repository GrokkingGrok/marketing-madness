import { useEffect, useState, type CSSProperties } from 'react';
import { Copy, Download, Palette, RotateCcw, Trash, Upload } from 'lucide-react';
import { downloadJson } from '../lib/download.ts';
import { inProgress } from '../lib/game.ts';
import { deriveTheme } from '../lib/theme.ts';
import { href } from '../router.ts';
import { useApp } from '../state/app-state.tsx';
import { DocumentTitle } from '../components/document-title.tsx';
import { Mark } from '../components/mark.tsx';
import { ConfirmDialog } from '../components/confirm-dialog.tsx';
import { Button } from '../components/ui/button.tsx';
import { Dialog, DialogActions } from '../components/ui/dialog.tsx';
import { Input, Label } from '../components/ui/input.tsx';
import { Menu, MenuItem } from '../components/ui/menu.tsx';

type InstallPrompt = Event & { prompt: () => Promise<void> };

export function HomeScreen() {
  const app = useApp();
  const [rename, setRename] = useState<{ id: string; title: string } | null>(null);
  const [recolor, setRecolor] = useState<{ id: string; color: string } | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstall(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const removing = app.modules.find((item) => item.current.id === removeId);
  const resetting = app.modules.find((item) => item.current.id === resetId);

  return (
    <div className="page" data-screen="home">
      <DocumentTitle title="Marketing Madness" />
      <header className="home-bar">
        <a className="wordmark" href="#/">
          <Mark />
          <span>Marketing Madness</span>
        </a>
        <div className="play-actions">
          {installed ? <span className="quiet">Installed on this device</span> : null}
          {install ? (
            <Button
              onClick={() => {
                void install.prompt();
              }}
            >
              Install app
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <a href={href({ name: 'new', mode: 'import' })}>
              <Upload size={16} /> Import
            </a>
          </Button>
          <Button
            variant="outline"
            disabled={app.modules.length === 0}
            onClick={() =>
              downloadJson('marketing-madness-modules.json', {
                format: 'marketing-madness-modules',
                modules: app.modules.map((item) => item.current),
              })
            }
          >
            <Download size={16} /> Export all
          </Button>
          <Button asChild>
            <a href={href({ name: 'new', mode: 'choose' })}>New module</a>
          </Button>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">DECA and marketing review</p>
        <h1>Run the board on one screen.</h1>
        <p className="lede">
          Five categories, ten point values, and a scoreboard for the room. Product Phenomenon is ready to project.
          Add another module from a FileMaker .tab file whenever you have the export.
        </p>
      </section>

      {app.modules.length === 0 ? (
        <div className="empty-panel">
          <h2>Nothing on the shelf yet</h2>
          <p>Start a blank board or import a .tab or JSON file. No account, and nothing leaves this browser.</p>
          <Button asChild>
            <a href={href({ name: 'new', mode: 'choose' })}>New module</a>
          </Button>
        </div>
      ) : (
        <div className="module-grid">
          {app.modules.map((item) => {
            const theme = deriveTheme(item.current.accentColor);
            const progress = inProgress(app.persistedGame(item.current.id));
            return (
              <article key={item.current.id} className="module-card" style={{ '--card-accent': theme.accent } as CSSProperties}>
                <div className="card-top">
                  <a className="card-title" href={href({ name: 'board', moduleId: item.current.id })}>
                    <span className="swatch" style={{ background: theme.accent }} />
                    <span>
                      <h2>{item.current.title}</h2>
                      <p className="quiet">5 categories · 50 clues</p>
                    </span>
                  </a>
                  <Menu label={`Actions for ${item.current.title}`}>
                    <MenuItem onSelect={() => setRename({ id: item.current.id, title: item.current.title })}>Rename</MenuItem>
                    <MenuItem onSelect={() => setRecolor({ id: item.current.id, color: item.current.accentColor })}>
                      Change color
                    </MenuItem>
                    <MenuItem onSelect={() => app.duplicateModule(item.current.id)}>Duplicate</MenuItem>
                    <MenuItem onSelect={() => downloadJson(`${item.current.id}.json`, item.current)}>Export</MenuItem>
                    <MenuItem disabled={!item.edited} onSelect={() => setResetId(item.current.id)}>
                      Reset to original
                    </MenuItem>
                    <MenuItem tone="danger" onSelect={() => setRemoveId(item.current.id)}>
                      Delete
                    </MenuItem>
                  </Menu>
                </div>
                <ul className="cat-pills">
                  {item.current.categories.map((category) => (
                    <li key={category.id}>{category.name}</li>
                  ))}
                </ul>
                <div className="badge-row">
                  {item.edited ? <span className="badge">Edited</span> : null}
                  {progress ? <span className="badge badge-live">Game in progress</span> : null}
                  {item.origin === 'imported' ? <span className="badge">Imported</span> : null}
                </div>
                <Button asChild>
                  <a href={href({ name: 'board', moduleId: item.current.id })}>Play</a>
                </Button>
              </article>
            );
          })}
        </div>
      )}

      {app.hiddenBundled.length > 0 ? (
        <section className="restore-row">
          <h2>Hidden built-in modules</h2>
          <ul>
            {app.hiddenBundled.map((module) => (
              <li key={module.id}>
                <span>{module.title}</span>
                <Button variant="outline" size="sm" onClick={() => app.restoreBundled(module.id)}>
                  <RotateCcw size={14} /> Restore
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="home-note">
        <p>
          Install it from Chrome and it keeps working offline, including your edits, scores, and imported modules.
          There are no passwords.
        </p>
        <p className="quiet">
          <Palette size={14} /> Each module carries its own accent. Product Phenomenon stays the original green.
          <Copy size={14} /> Export a module and drop the JSON into <code>modules/</code> when it should ship with the app.
          <Trash size={14} /> Delete only hides a built-in module on this browser.
        </p>
      </footer>

      <Dialog
        open={rename !== null}
        onOpenChange={(open) => { if (!open) setRename(null); }}
        title="Rename module"
        description="The link stays the same. Only the title changes."
      >
        <Label htmlFor="rename-title">Title</Label>
        <Input
          id="rename-title"
          value={rename?.title ?? ''}
          onChange={(event) => setRename((current) => (current ? { ...current, title: event.target.value } : current))}
          autoFocus
        />
        <DialogActions>
          <Button variant="outline" onClick={() => setRename(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!rename) return;
              const resolved = app.getModule(rename.id);
              if (resolved && rename.title.trim()) {
                app.updateModule({ ...resolved.current, title: rename.title.trim() }, 'Title saved');
              }
              setRename(null);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={recolor !== null}
        onOpenChange={(open) => { if (!open) setRecolor(null); }}
        title="Change color"
        description="Question screens use a light tint. The answer screen uses the accent."
      >
        <div className="color-row">
          <input
            aria-label="Accent color"
            type="color"
            value={recolor?.color ?? '#007300'}
            onChange={(event) => setRecolor((current) => (current ? { ...current, color: event.target.value } : current))}
          />
          <Input
            value={recolor?.color ?? ''}
            onChange={(event) => setRecolor((current) => (current ? { ...current, color: event.target.value } : current))}
            spellCheck={false}
          />
          <span className="swatch lg" style={{ background: recolor?.color ?? '#007300' }} />
        </div>
        <DialogActions>
          <Button variant="outline" onClick={() => setRecolor(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!recolor) return;
              const resolved = app.getModule(recolor.id);
              if (resolved) app.updateModule({ ...resolved.current, accentColor: recolor.color }, 'Color saved');
              setRecolor(null);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={removing !== undefined}
        title={removing ? `Delete ${removing.current.title}?` : 'Delete module?'}
        description={
          removing?.origin === 'bundled'
            ? 'This hides the built-in module on this browser and clears its saved game. You can restore it from the home screen.'
            : 'This removes the module and its saved game from this browser.'
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (removeId) app.deleteModule(removeId);
          setRemoveId(null);
        }}
        onClose={() => setRemoveId(null)}
      />

      <ConfirmDialog
        open={resetting !== undefined}
        title={resetting ? `Reset ${resetting.current.title}?` : 'Reset module?'}
        description="Your edits to categories, questions, and answers are replaced with the original copy."
        confirmLabel="Reset to original"
        onConfirm={() => {
          if (resetId) app.resetModule(resetId);
          setResetId(null);
        }}
        onClose={() => setResetId(null)}
      />
    </div>
  );
}
