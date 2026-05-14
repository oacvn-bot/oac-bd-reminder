import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, doc, getDoc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Save, AlertCircle, RefreshCw, Database, Calendar } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { format } from 'date-fns';

export default function AdminScripts() {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  const [startDateStr, setStartDateStr] = useState<string>("");
  const [savingConfig, setSavingConfig] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base focus:outline-none min-h-[300px] max-w-none text-slate-200',
      },
    },
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'config', 'app'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.startDate) {
            setStartDateStr(format(data.startDate.toDate(), 'yyyy-MM-dd'));
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'config/app');
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchScript = async () => {
      setLoading(true);
      setSaveMessage("");
      try {
        const docSnap = await getDoc(doc(db, 'scripts', selectedDay.toString()));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSubject(data.subject || "");
          editor?.commands.setContent(data.bodyHtml || "");
        } else {
          setSubject("");
          editor?.commands.setContent("");
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `scripts/${selectedDay}`);
      }
      setLoading(false);
    };

    if (editor) {
      fetchScript();
    }
  }, [selectedDay, editor]);

  const handleSaveConfig = async () => {
    if (!startDateStr) return;
    setSavingConfig(true);
    setSaveMessage("");
    try {
      await setDoc(doc(db, 'config', 'app'), {
        startDate: new Date(startDateStr + 'T00:00:00Z'),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSaveMessage("Start date updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/app');
      setSaveMessage("Error saving config.");
    }
    setSavingConfig(false);
  };

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    setSaveMessage("");

    const bodyHtml = editor.getHTML();
    let phase = 1;
    if (selectedDay > 7) phase = 2;
    if (selectedDay > 14) phase = 3;

    try {
      await setDoc(doc(db, 'scripts', selectedDay.toString()), {
        subject,
        bodyHtml,
        phase,
        updatedAt: serverTimestamp()
      });
      setSaveMessage("Script saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `scripts/${selectedDay}`);
      setSaveMessage("Error saving script.");
    }
    setSaving(false);
  };

  const handleSeedDatabase = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      await setDoc(doc(db, 'config', 'app'), {
        startDate: new Date('2026-05-12T00:00:00Z'),
        totalAccounts: 10,
        updatedAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'scripts', '1'), {
        subject: 'Quick question about [Company]',
        bodyHtml: '<p>Hi [Name],</p><p>I was reviewing [Company]\'s recent developments and noticed...</p><p>Would you be open to a brief chat next Tuesday?</p>',
        phase: 1,
        updatedAt: serverTimestamp()
      });
      
      setSaveMessage("Database seeded successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `config/app`);
      setSaveMessage("Error seeding database.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-white">Script Manager</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-background/50 border border-boder rounded-xl p-1 pr-2">
            <div className="bg-slate-800 p-1.5 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-300" />
            </div>
            <input 
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none w-32"
            />
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig || !startDateStr}
              className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors"
            >
              Update Start Date
            </button>
          </div>
          <button
            onClick={handleSeedDatabase}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors shadow-lg border border-boder text-sm"
          >
            <Database className="w-4 h-4" />
            Seed Database
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Sidebar: Day List */}
        <div className="w-64 glass rounded-2xl flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-boder bg-background/50">
            <h2 className="font-semibold text-white">28-Day Plan</h2>
            <p className="text-xs text-slate-400">Select a day to edit</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
            let phase = 1;
            if (day > 7) phase = 2;
            if (day > 14) phase = 3;
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${
                  selectedDay === day 
                    ? 'bg-primary/20 text-primary glow-blue font-medium' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span>Day {day}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                   phase === 1 ? 'bg-amber-500/10 text-amber-500' :
                   phase === 2 ? 'bg-blue-500/10 text-blue-500' :
                   'bg-success/10 text-success'
                }`}>
                  P{phase}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-boder flex justify-between items-center bg-background/50">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Edit Script • Day {selectedDay}</h2>
            <p className="text-sm text-slate-400">Phase {selectedDay <= 7 ? 1 : selectedDay <= 14 ? 2 : 3} Warm-up</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-blue-600 transition-all font-medium disabled:opacity-50 shadow-lg shadow-primary/25 glow-blue"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

        {saveMessage && (
          <div className={`px-6 py-3 border-b border-boder text-sm font-medium ${saveMessage.includes('Error') ? 'bg-rose-500/10 text-rose-500' : 'bg-success/10 text-success glow-green'}`}>
            {saveMessage}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <div className="mb-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Quick question about [Company]"
                className="w-full bg-background/50 border border-boder rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-lg"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Email Body (Rich Text)</label>
              
              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-2 p-2 bg-background/50 border border-boder rounded-lg">
                <button
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <span className="font-bold">B</span>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded italic ${editor?.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  I
                </button>
              </div>

              <div className="flex-1 bg-background/50 border border-boder rounded-xl p-4 cursor-text overflow-y-auto">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
