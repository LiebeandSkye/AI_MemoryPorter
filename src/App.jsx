import { useState } from 'react';
import { UploadCloud, FileJson, Download, X, CheckSquare, Square, Info } from 'lucide-react';

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConvoIds, setSelectedConvoIds] = useState(new Set());
  const [otherData, setOtherData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          
          if (file.name.includes('conversations')) {
            
            const validConvos = json.filter(c => c.chat_messages && c.chat_messages.length > 0);
            setConversations(prev => [...prev, ...validConvos]);
            
            setSelectedConvoIds(prev => new Set([...prev, ...validConvos.map(c => c.uuid)]));
            setUploadedFiles(prev => [...prev, { name: file.name, type: 'conversations', count: validConvos.length }]);
            setIsModalOpen(true); 
          } else {
            
            setOtherData(prev => ({ ...prev, [file.name]: json }));
            setUploadedFiles(prev => [...prev, { name: file.name, type: 'other' }]);
          }
        } catch (error) {
          alert(`Could not parse ${file.name}. Ensure it is a valid JSON export.`);
        }
      };
      reader.readAsText(file);
    });
    
    
    event.target.value = null; 
  };

  const toggleSelection = (uuid) => {
    const newSet = new Set(selectedConvoIds);
    if (newSet.has(uuid)) newSet.delete(uuid);
    else newSet.add(uuid);
    setSelectedConvoIds(newSet);
  };

  const selectAll = (select) => {
    if (select) setSelectedConvoIds(new Set(conversations.map(c => c.uuid)));
    else setSelectedConvoIds(new Set());
  };

  
  const generateMarkdown = () => {
    let mdOutput = `# Core Memory & Context Archive\n\n`;

    
    Object.entries(otherData).forEach(([fileName, data]) => {
      mdOutput += `## Context Source: ${fileName}\n`;
      mdOutput += '```json\n' + JSON.stringify(data, null, 2) + '\n```\n\n';
    });

    
    const selectedConvosList = conversations.filter(c => selectedConvoIds.has(c.uuid));
    if (selectedConvosList.length > 0) {
      mdOutput += `## Selected Historical Conversations\n\n`;
      
      selectedConvosList.forEach((conv) => {
        const title = conv.name || `Unnamed Chat`;
        const date = conv.created_at ? new Date(conv.created_at).toLocaleDateString() : 'Unknown Date';
        
        mdOutput += `### [${date}] ${title}\n\n`;

        conv.chat_messages.forEach((msg) => {
          const sender = msg.sender === 'human' ? 'User' : 'Assistant';
          mdOutput += `**${sender}:**\n${msg.text}\n\n`;
        });
        mdOutput += `---\n\n`;
      });
    }

    
    const blob = new Blob([mdOutput], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'curated_ai_memory.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
    if (fileName.includes('conversations')) {
      setConversations([]);
      setSelectedConvoIds(new Set());
    } else {
      const newData = { ...otherData };
      delete newData[fileName];
      setOtherData(newData);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* Main Container */}
      <div className="max-w-4xl mx-auto pt-16 px-6 space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Memory Porter</h1>
          <p className="text-neutral-400 text-lg">Curate and transfer exact AI memories. Upload, filter, and export.</p>
          <p className='text-neutral-400 text-sm'>Running out of tokens? yes me too and im mad so i build this. If you want to continue your projects u cant just export your claude memory to another model as it will use up ALOT of tokens therefore this will help reduce ur token usage and transfer your conversation to another AI provider.</p>
        </header>

        {/* Upload Zone */}
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-neutral-800 border-dashed rounded-2xl cursor-pointer bg-neutral-900/40 hover:bg-neutral-900 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-4 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
            <p className="mb-2 text-sm text-neutral-400">
              <span className="font-semibold text-white">Click to upload files</span> or drag and drop
            </p>
            <p className="text-xs text-neutral-500">Supports users.json, memories.json, conversations.json</p>
          </div>
          <input type="file" className="hidden" multiple accept=".json" onChange={handleFileUpload} />
        </label>

        {/* Staging Area (Uploaded Files) */}
        {uploadedFiles.length > 0 && (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Staging Area</h2>
              {conversations.length > 0 && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Manage Conversations ({selectedConvoIds.size} selected)
                </button>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <FileJson className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="font-medium text-neutral-200">{f.name}</p>
                      {f.type === 'conversations' && <p className="text-xs text-neutral-500">{f.count} total chats detected</p>}
                    </div>
                  </div>
                  <button onClick={() => removeFile(f.name)} className="text-neutral-500 hover:text-red-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={generateMarkdown}
              disabled={uploadedFiles.length === 0}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/20"
            >
              <Download className="w-5 h-5" />
              <span>Compile & Download Context (.md)</span>
            </button>
          </div>
        )}

        {/* Step-by-Step Guide Section */}
        <div className="mt-16 border-t border-neutral-800 pt-12">
          <div className="flex items-center space-x-2 mb-8">
            <Info className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white">How to Transfer Your Memory</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <GuideCard step="1" title="Export Your Data" desc="Go to your AI provider (like Claude) > Settings > Profile/Privacy > Export Data. Wait for the email and download the .zip file." />
            <GuideCard step="2" title="Upload Files" desc="Extract the .zip. Drag and drop files like 'users.json', 'memories.json', and 'conversations.json' into the upload box above." />
            <GuideCard step="3" title="Curate Conversations" desc="If you uploaded conversations.json, a menu will appear. Select ONLY the specific chats you want the new AI to remember to avoid cluttering its context." />
            <GuideCard step="4" title="Compile & Inject" desc="Click 'Compile & Download'. Take the resulting .md file and upload it into your new AI provider (e.g., Claude Projects or a ChatGPT Custom GPT) as a core knowledge file." />
          </div>
        </div>

      </div>

      {/* Conversation Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div>
                <h3 className="text-xl font-bold text-white">Select Conversations</h3>
                <p className="text-sm text-neutral-400">Choose which chats to inject into the new memory.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white p-2 bg-neutral-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 flex space-x-4">
              <button onClick={() => selectAll(true)} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Select All</button>
              <button onClick={() => selectAll(false)} className="text-sm text-neutral-400 hover:text-neutral-300 font-medium">Deselect All</button>
              <span className="text-sm text-neutral-500 ml-auto">{selectedConvoIds.size} / {conversations.length} selected</span>
            </div>

            {/* Modal Scrollable List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
              {conversations.map((conv) => {
                const isSelected = selectedConvoIds.has(conv.uuid);
                const msgCount = conv.chat_messages ? conv.chat_messages.length : 0;
                const date = conv.created_at ? new Date(conv.created_at).toLocaleDateString() : '';

                return (
                  <div 
                    key={conv.uuid} 
                    onClick={() => toggleSelection(conv.uuid)}
                    className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-600'}`}
                  >
                    <div className="mt-1 mr-4">
                      {isSelected ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5 text-neutral-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-200 truncate">{conv.name || 'Unnamed Conversation'}</h4>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-neutral-500">
                        <span>{date}</span>
                        <span>•</span>
                        <span className={msgCount > 50 ? 'text-amber-500/80 font-medium' : ''}>{msgCount} messages</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-800 bg-neutral-900 rounded-b-2xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Confirm Selection ({selectedConvoIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function GuideCard({ step, title, desc }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute -top-6 -right-6 text-8xl font-black text-neutral-800/30 select-none">{step}</div>
      <h3 className="text-lg font-bold text-white mb-2 relative z-10">{title}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed relative z-10">{desc}</p>
    </div>
  );
}