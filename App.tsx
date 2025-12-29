
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  CreditCard, 
  LayoutDashboard, 
  Plus, 
  Trophy, 
  LogOut, 
  Send, 
  Sparkles, 
  MessageCircle, 
  Bell, 
  BrainCircuit, 
  Search, 
  Check, 
  X, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Unlock, 
  User, 
  Trash2, 
  Download, 
  Upload, 
  Cloud, 
  UserPlus,
  Settings as SettingsIcon,
  ChevronRight,
  Target
} from 'lucide-react';
import { loadData, saveData } from './db';
import { Student, Attendance, Payment, BeltRank, AppView, StaffMember, Announcement } from './types';
import { askSenseiAI } from './geminiService';

const BeltBadge: React.FC<{ belt: string, stripes: number }> = ({ belt, stripes }) => {
  const colors: Record<string, string> = {
    'Branca': 'bg-zinc-100',
    'Azul': 'bg-blue-600',
    'Roxa': 'bg-purple-700',
    'Marrom': 'bg-amber-900',
    'Preta': 'bg-zinc-950',
    'Cinza/Branca': 'bg-zinc-400',
    'Amarela': 'bg-yellow-400',
    'Laranja': 'bg-orange-500',
    'Verde': 'bg-emerald-600',
  };
  return (
    <div className="belt-rank shadow-lg">
      <div className={`belt-main ${colors[belt] || 'bg-zinc-500'}`}></div>
      <div className="belt-tip">{[...Array(stripes)].map((_, i) => (<div key={i} className="stripe" />))}</div>
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState(loadData());
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [userSession, setUserSession] = useState<{ role: 'ADM' | 'STAFF', name: string, id?: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States para Modais e Inputs
  const [loginType, setLoginType] = useState<'ADM' | 'STAFF'>('STAFF');
  const [nameInput, setNameInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);

  useEffect(() => { saveData(data); }, [data]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === 'ADM') {
      if (passInput === data.settings.accessPassword) {
        setUserSession({ role: 'ADM', name: 'Administrador', id: 'adm-01' });
      } else alert("Senha Mestre incorreta!");
    } else {
      const member = data.staff.find(s => s.name.toLowerCase() === nameInput.toLowerCase() && s.password === passInput);
      if (!member) return alert("Professor ou Senha não encontrados.");
      if (!member.active) return alert("ACESSO BLOQUEADO PELO ADMINISTRADOR. OSS!");
      setUserSession({ role: 'STAFF', name: member.name, id: member.id });
    }
    setPassInput('');
    setNameInput('');
  };

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const fileName = `BACKUP_OSS_${data.settings.academyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("Arquivo de Backup criado! Agora salve este arquivo no seu Google Drive ou iCloud. OSS!");
    } catch (err) {
      alert("Erro ao exportar dados.");
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.settings && json.students) {
          if (confirm("ATENÇÃO: Isso irá apagar os dados atuais e substituir pelo backup. Continuar? OSS!")) {
            setData(json);
            alert("Sistema restaurado com sucesso!");
          }
        } else {
          alert("Arquivo inválido.");
        }
      } catch (err) {
        alert("Erro na leitura do arquivo.");
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const handleWhatsApp = (phone: string, msg: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const isAdm = userSession?.role === 'ADM';
  const today = new Date().toISOString().split('T')[0];

  const filteredStudents = useMemo(() => {
    let list = data.students;
    return list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data.students, searchTerm]);

  // Filtro específico para o financeiro: ADM vê tudo, Staff vê apenas os seus alunos
  const financialStudents = useMemo(() => {
    if (isAdm) return data.students;
    return data.students.filter(s => s.professorId === userSession?.id);
  }, [data.students, isAdm, userSession?.id]);

  const getProfessorName = (id?: string) => {
    if (!id) return 'Não atribuído';
    if (id === 'adm-01') return 'Administrador';
    return data.staff.find(s => s.id === id)?.name || 'Desconhecido';
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-rose-600 selection:text-white">
      {!userSession ? (
        <div className="min-h-screen flex items-center justify-center p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
          <div className="w-full max-sm:px-4 max-w-sm">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
                <Trophy size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-center mb-2 tracking-tighter uppercase">{data.settings.academyName}</h1>
            <p className="text-center text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-10">OSS Manager Pro</p>
            
            <div className="flex bg-zinc-900 p-1 rounded-2xl mb-6">
              <button onClick={() => setLoginType('STAFF')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${loginType === 'STAFF' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>Professor</button>
              <button onClick={() => setLoginType('ADM')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${loginType === 'ADM' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>Administrador</button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginType === 'STAFF' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input type="text" placeholder="SEU NOME" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-5 pl-12 pr-6 text-white focus:border-rose-600 outline-none transition-all" value={nameInput} onChange={e => setNameInput(e.target.value)} required />
                </div>
              )}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="password" placeholder="SENHA DE ACESSO" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-5 pl-12 pr-6 text-white focus:border-rose-600 outline-none tracking-widest transition-all" value={passInput} onChange={e => setPassInput(e.target.value)} required />
              </div>
              <button className="w-full bg-rose-600 py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-rose-500 transition-all active:scale-95 shadow-xl shadow-rose-600/20">Entrar no Tatame</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="pb-24 md:pb-0 md:pl-20">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex fixed inset-y-0 left-0 w-20 bg-zinc-900 border-r border-zinc-800 flex-col items-center py-8 z-50">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center mb-12 shadow-lg cursor-pointer" onClick={() => setCurrentView('dashboard')}><Trophy size={20} /></div>
            <nav className="flex-1 space-y-6">
              {[
                { id: 'dashboard', icon: LayoutDashboard, show: true },
                { id: 'students', icon: Users, show: true },
                { id: 'attendance', icon: Sparkles, show: true },
                { id: 'payments', icon: CreditCard, show: true }, // Liberado para todos logados
                { id: 'staff', icon: ShieldCheck, show: isAdm },
                { id: 'mural', icon: Bell, show: true },
              ].filter(i => i.show).map(item => (
                <button key={item.id} onClick={() => setCurrentView(item.id as any)} className={`p-3 rounded-xl transition-all ${currentView === item.id ? 'bg-rose-600 text-white shadow-lg' : 'text-zinc-600 hover:text-white'}`}>
                  <item.icon size={22} />
                </button>
              ))}
            </nav>
            <div className="flex flex-col gap-4">
              {isAdm && <button onClick={() => setIsSettingsModalOpen(true)} className="text-zinc-600 hover:text-white"><SettingsIcon size={20} /></button>}
              <button onClick={() => setUserSession(null)} className="text-zinc-600 hover:text-rose-500 mb-4"><LogOut size={20} /></button>
            </div>
          </aside>

          {/* Mobile Nav */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 px-4 py-3 flex justify-around items-center z-50 safe-bottom">
            {[
              { id: 'dashboard', icon: LayoutDashboard, show: true },
              { id: 'students', icon: Users, show: true },
              { id: 'attendance', icon: Sparkles, show: true },
              { id: 'payments', icon: CreditCard, show: true }, // Liberado para todos logados
              { id: 'staff', icon: ShieldCheck, show: isAdm },
              { id: 'mural', icon: Bell, show: true },
            ].filter(i => i.show).map(item => (
              <button key={item.id} onClick={() => setCurrentView(item.id as any)} className={`p-2 transition-all flex flex-col items-center gap-1 ${currentView === item.id ? 'text-rose-600' : 'text-zinc-600'}`}>
                <item.icon size={22} />
                <span className="text-[8px] font-bold uppercase">{item.id === 'dashboard' ? 'Início' : item.id === 'attendance' ? 'Treino' : item.id === 'payments' ? 'Finanças' : item.id}</span>
              </button>
            ))}
          </nav>

          <main className="max-w-4xl mx-auto p-6 md:py-12">
            <header className="flex justify-between items-start mb-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{isAdm ? 'ADMINISTRADOR' : `PROF: ${userSession.name}`}</p>
                  <div className="h-px w-8 bg-zinc-800"></div>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tighter uppercase italic flex items-center gap-3">
                  {currentView === 'dashboard' ? 'Painel' : 
                   currentView === 'students' ? 'Atletas' :
                   currentView === 'attendance' ? 'Chamada' :
                   currentView === 'payments' ? 'Financeiro' :
                   currentView === 'staff' ? 'Equipe' : 'Mural'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {isAdm && (
                  <button onClick={() => setIsSettingsModalOpen(true)} className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 text-zinc-500 hover:text-white transition-all md:hidden">
                    <SettingsIcon size={22} />
                  </button>
                )}
                <button onClick={() => setIsChatOpen(true)} className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 text-rose-600 shadow-xl transition-transform hover:scale-110 active:scale-95 flex items-center gap-2">
                  <BrainCircuit size={24} />
                  <span className="hidden md:inline text-[10px] font-black uppercase pr-2">Sensei IA</span>
                </button>
              </div>
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {currentView === 'dashboard' && (
                <div className="space-y-6">
                  {isAdm ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800">
                        <p className="text-2xl font-black">{data.students.length}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Alunos</p>
                      </div>
                      <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800">
                        <p className="text-2xl font-black text-rose-600">{data.payments.filter(p => p.status === 'pending').length}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Pendentes</p>
                      </div>
                      <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800">
                        <p className="text-2xl font-black text-amber-500">{data.attendance.filter(a => a.date === today).length}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">No Tatame</p>
                      </div>
                      <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800">
                        <p className="text-2xl font-black text-emerald-500">{data.staff.length}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Professores</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex flex-col justify-between items-start">
                         <div>
                            <h4 className="text-2xl font-black italic uppercase tracking-tight mb-2">Oss, {userSession.name}!</h4>
                            <p className="text-zinc-500 text-sm">Gerencie seus alunos e cobranças.</p>
                         </div>
                         <div className="flex gap-3 mt-6 w-full">
                           <button onClick={() => setIsStudentModalOpen(true)} className="flex-1 bg-rose-600 text-white px-6 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all"><UserPlus size={18} /> Novo Aluno</button>
                         </div>
                      </div>
                      <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 flex items-center justify-between">
                         <div>
                            <p className="text-3xl font-black text-rose-600">{financialStudents.filter(s => data.payments.some(p => p.studentId === s.id && p.status === 'pending')).length}</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Suas Mensalidades Pendentes</p>
                         </div>
                         <button onClick={() => setCurrentView('payments')} className="bg-zinc-800 p-4 rounded-2xl text-rose-600"><CreditCard size={24} /></button>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex flex-col md:flex-row gap-6 justify-between items-center mt-6">
                    <div>
                      <h4 className="font-bold text-xl mb-1">Chamada do Dia</h4>
                      <p className="text-zinc-500 text-sm">Controle quem está no tatame agora.</p>
                    </div>
                    <button onClick={() => setCurrentView('attendance')} className="w-full md:w-auto bg-white text-black px-10 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-transform">Abrir Chamada</button>
                  </div>

                  {isAdm && (
                    <div className="bg-rose-600 p-8 rounded-[2.5rem] shadow-xl shadow-rose-600/20 space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="bg-white/20 p-4 rounded-2xl text-white">
                             <Cloud size={24} />
                          </div>
                          <div>
                             <h4 className="font-bold text-lg">Backup Gratuito (Google Drive)</h4>
                             <p className="text-rose-100 text-sm opacity-90">Sua conta, seus dados. Sem custos.</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button onClick={handleExportData} className="bg-white text-black p-5 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-100 transition-all group">
                             <Download size={20} className="text-rose-600 group-hover:scale-110 transition-transform" />
                             <p className="font-black text-[10px] uppercase tracking-widest">Salvar no Drive</p>
                          </button>
                          
                          <div className="relative">
                            <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
                            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-black/20 border border-white/20 text-white p-5 rounded-2xl flex flex-col items-center gap-2 hover:bg-black/30 transition-all group">
                               <Upload size={20} className="text-white group-hover:scale-110 transition-transform" />
                               <p className="font-black text-[10px] uppercase tracking-widest">Recuperar do Drive</p>
                            </button>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {currentView === 'attendance' && (
                <div className="space-y-6">
                   <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden">
                      <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                        <h3 className="font-bold text-xl uppercase italic">Quem está no Tatame?</h3>
                        <span className="bg-zinc-800 px-4 py-1 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{today}</span>
                      </div>
                      <div className="divide-y divide-zinc-800">
                        {data.students.length === 0 ? (
                          <div className="p-10 text-center text-zinc-500 font-bold uppercase text-xs tracking-widest">Aguardando novos alunos...</div>
                        ) : (
                          data.students.map(s => {
                            const isPresent = data.attendance.some(a => a.studentId === s.id && a.date === today);
                            return (
                              <div key={s.id} className="p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-10 rounded-full transition-all duration-500 ${isPresent ? 'bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.5)]' : 'bg-zinc-800'}`}></div>
                                    <div>
                                       <p className="font-bold">{s.name}</p>
                                       <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">{s.belt}</p>
                                    </div>
                                 </div>
                                 <button 
                                  onClick={() => {
                                    if (isPresent) {
                                      setData(p => ({...p, attendance: p.attendance.filter(a => !(a.studentId === s.id && a.date === today))}));
                                    } else {
                                      setData(p => ({...p, attendance: [...p.attendance, {id: Math.random().toString(36).substr(2,9), studentId: s.id, date: today, classType: 'GI'}]}));
                                    }
                                  }}
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isPresent ? 'bg-rose-600 text-white scale-110 shadow-lg' : 'bg-zinc-800 text-zinc-600 hover:text-white'}`}
                                 >
                                   {isPresent ? <Check size={24} /> : <Plus size={20} />}
                                 </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                   </div>
                </div>
              )}

              {currentView === 'payments' && (
                <div className="space-y-6">
                   <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden">
                      <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-xl uppercase italic">Mensalidades</h3>
                          {!isAdm && <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Apenas seus alunos</p>}
                        </div>
                        <CreditCard className="text-rose-600" />
                      </div>
                      <div className="divide-y divide-zinc-800">
                        {financialStudents.length === 0 ? (
                          <div className="p-20 text-center text-zinc-500 font-bold uppercase text-xs tracking-widest italic opacity-50">
                             Nenhum aluno sob sua responsabilidade financeira.
                          </div>
                        ) : (
                          financialStudents.map(s => {
                            const pending = data.payments.find(p => p.studentId === s.id && p.status === 'pending');
                            return (
                              <div key={s.id} className="p-6 flex items-center justify-between">
                                 <div>
                                    <p className="font-bold">{s.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">
                                       {isAdm ? `Prof: ${getProfessorName(s.professorId)}` : 'Sua Turma'}
                                    </p>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    {pending ? (
                                      <>
                                         <button onClick={() => handleWhatsApp(s.phone, `OSS ${s.name}! Passando para lembrar da mensalidade. Forte abraço!`)} className="bg-emerald-600/10 text-emerald-500 p-3 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><MessageCircle size={18} /></button>
                                         <button 
                                          onClick={() => setData(prev => ({
                                            ...prev,
                                            payments: prev.payments.map(p => p.id === pending.id ? {...p, status: 'paid'} : p)
                                          }))}
                                          className="bg-rose-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                         >Baixa</button>
                                      </>
                                    ) : (
                                      <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 px-4 py-2 rounded-full bg-emerald-500/10">Em Dia</span>
                                    )}
                                 </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                   </div>
                </div>
              )}

              {currentView === 'students' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input 
                        type="text" 
                        placeholder="BUSCAR ATLETA..." 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-rose-600 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <button onClick={() => setIsStudentModalOpen(true)} className="bg-rose-600 text-white px-8 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 hover:scale-105 transition-all">
                       <UserPlus size={18} /> Novo Atleta
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {filteredStudents.length === 0 ? (
                      <div className="p-20 text-center text-zinc-600 font-bold uppercase text-[10px] tracking-widest bg-zinc-900/20 rounded-[3rem] border border-zinc-800/50">Nenhum atleta na lista.</div>
                    ) : (
                      filteredStudents.map(s => (
                        <div key={s.id} className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 flex items-center justify-between group hover:bg-zinc-900 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-2xl bg-zinc-800 overflow-hidden border border-zinc-700 p-1">
                                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} alt={s.name} className="w-full h-full object-cover rounded-xl" />
                              </div>
                              <div>
                                 <h4 className="font-bold text-lg mb-0.5">{s.name}</h4>
                                 <div className="mb-2">
                                    <BeltBadge belt={s.belt} stripes={s.stripes} />
                                 </div>
                                 <p className="text-[9px] text-zinc-600 font-black uppercase tracking-wider">Mestre: {getProfessorName(s.professorId)}</p>
                              </div>
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleWhatsApp(s.phone, `OSS ${s.name}!`)} className="p-3 bg-zinc-800 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={20} /></button>
                              <button onClick={() => { if(confirm('Remover este aluno?')) setData(p => ({...p, students: p.students.filter(x => x.id !== s.id)})) }} className="p-3 bg-zinc-800 rounded-xl text-zinc-600 hover:text-rose-600 transition-all"><Trash2 size={20} /></button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {currentView === 'staff' && isAdm && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center px-4">
                      <h3 className="font-black text-zinc-600 uppercase text-[10px] tracking-[0.2em]">Sua Equipe de Professores</h3>
                      <button onClick={() => setIsStaffModalOpen(true)} className="text-rose-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-1"><Plus size={14} /> Novo Professor</button>
                   </div>
                   <div className="grid gap-4">
                     {data.staff.length === 0 ? (
                       <div className="p-10 text-center text-zinc-500 font-bold uppercase text-xs tracking-widest bg-zinc-900/30 rounded-[2.5rem] border border-zinc-800/50">Você ainda não tem professores.</div>
                     ) : (
                       data.staff.map(member => (
                         <div key={member.id} className={`p-6 rounded-[2.5rem] border flex items-center justify-between transition-all ${member.active ? 'bg-zinc-900 border-zinc-800 shadow-xl' : 'bg-zinc-900/20 border-zinc-900 opacity-50'}`}>
                            <div className="flex items-center gap-4">
                               <div className="bg-zinc-800 p-4 rounded-2xl text-rose-600"><UserCheck size={28} /></div>
                               <div>
                                  <p className="font-bold text-lg leading-tight">{member.name}</p>
                                  <div className="flex gap-4 mt-1">
                                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{member.role}</p>
                                    <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest">Senha: {member.password}</p>
                                  </div>
                               </div>
                            </div>
                            <button 
                              onClick={() => setData(prev => ({...prev, staff: prev.staff.map(s => s.id === member.id ? {...s, active: !s.active} : s)}))}
                              className={`p-4 rounded-2xl transition-all ${member.active ? 'bg-zinc-800 text-emerald-500' : 'bg-rose-600 text-white'}`}
                            >
                              {member.active ? <Unlock size={22} /> : <Lock size={22} />}
                            </button>
                         </div>
                       ))
                     )}
                   </div>
                </div>
              )}

              {currentView === 'mural' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center px-4">
                      <h3 className="font-black text-zinc-600 uppercase text-[10px] tracking-[0.2em]">Quadro de Avisos</h3>
                      {isAdm && <button onClick={() => setIsAnnouncementModalOpen(true)} className="bg-rose-600 text-white px-5 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><Plus size={14} /> Novo Post</button>}
                   </div>
                   <div className="grid gap-6">
                      {data.announcements.length === 0 ? (
                        <div className="p-20 text-center text-zinc-600 font-bold uppercase text-[10px] bg-zinc-900/30 rounded-[3rem] border border-zinc-800/50">O mural está vazio hoje.</div>
                      ) : (
                        data.announcements.map(ann => (
                          <div key={ann.id} className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 relative group overflow-hidden shadow-2xl">
                             <div className="flex justify-between mb-4">
                                <span className="bg-rose-600/10 text-rose-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase border border-rose-600/20">{ann.category}</span>
                                <span className="text-zinc-600 text-[10px] font-bold">{ann.date}</span>
                             </div>
                             <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-3 leading-tight">{ann.title}</h4>
                             <p className="text-zinc-400 leading-relaxed mb-4 text-sm">{ann.content}</p>
                             {isAdm && <button onClick={() => setData(p => ({...p, announcements: p.announcements.filter(x => x.id !== ann.id)}))} className="absolute top-8 right-8 text-zinc-800 group-hover:text-rose-600 transition-colors"><Trash2 size={20} /></button>}
                          </div>
                        ))
                      )}
                   </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* MODAIS (Configurações, Aluno, Staff, Mural, AI Sensei) mantidos conforme versão anterior para consistência */}
      
      {/* ... Código dos modais mantido igual ao anterior para não inflar o arquivo desnecessariamente ... */}
      
      {/* Aluno Modal (Atualizado com vínculo de professor) */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
             <div className="flex justify-between mb-8">
               <div>
                 <h3 className="text-2xl font-black uppercase italic">Nova Matrícula</h3>
                 <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Responsável: {userSession?.name}</p>
               </div>
               <button onClick={() => setIsStudentModalOpen(false)}><X size={24} /></button>
             </div>
             <form className="space-y-4" onSubmit={e => {
               e.preventDefault();
               const f = new FormData(e.currentTarget);
               const n: Student = {
                 id: Math.random().toString(36).substr(2,9),
                 name: f.get('name') as string,
                 email: '',
                 belt: f.get('belt') as BeltRank,
                 stripes: parseInt(f.get('stripes') as string),
                 joinDate: today,
                 active: true,
                 phone: f.get('phone') as string,
                 lastPaymentDate: today,
                 professorId: userSession?.id
               };
               setData(p => ({
                 ...p, 
                 students: [...p.students, n],
                 payments: [...p.payments, {id: Math.random().toString(36).substr(2,9), studentId: n.id, amount: 150, date: today, status: 'pending'}]
               }));
               setIsStudentModalOpen(false);
             }}>
                <input name="name" required placeholder="NOME DO ATLETA" className="w-full bg-zinc-800 p-5 rounded-2xl outline-none focus:border-rose-600 border border-transparent font-bold" />
                <div className="grid grid-cols-2 gap-4">
                   <select name="belt" className="bg-zinc-800 p-5 rounded-2xl outline-none font-bold">
                      {Object.values(BeltRank).map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                   <select name="stripes" className="bg-zinc-800 p-5 rounded-2xl outline-none font-bold">
                      <option value="0">0 Graus</option><option value="1">1 Grau</option><option value="2">2 Graus</option><option value="3">3 Graus</option><option value="4">4 Graus</option>
                   </select>
                </div>
                <input name="phone" placeholder="WHATSAPP (DDD + NÚMERO)" className="w-full bg-zinc-800 p-5 rounded-2xl outline-none font-bold" />
                <button type="submit" className="w-full bg-rose-600 py-5 rounded-2xl font-bold uppercase tracking-widest mt-4 hover:scale-105 transition-all shadow-lg shadow-rose-600/20">Finalizar Matrícula</button>
             </form>
          </div>
        </div>
      )}

      {/* AI Chat e outros Modais aqui... */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="bg-rose-600 p-3 rounded-2xl"><BrainCircuit size={24} className="text-white" /></div>
                <div>
                  <h4 className="font-bold text-white text-lg leading-none">Sensei IA</h4>
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">Consultoria Estratégica</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-zinc-500 hover:text-white p-2"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6">
                   <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-rose-600 animate-pulse">
                      <Sparkles size={40} />
                   </div>
                   <div className="space-y-2">
                     <h5 className="font-bold text-xl uppercase italic">Como posso ajudar?</h5>
                     <p className="text-zinc-500 text-xs italic opacity-70 leading-relaxed">"Quem está sumido dos treinos há 2 semanas?"<br/>"Quem está elegível para o 4º grau?"<br/>"Qual professor cadastrou mais alunos este mês?"</p>
                   </div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-rose-600 text-white font-bold' : 'bg-zinc-800 text-white border border-zinc-700 shadow-xl'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isAskingAI && <div className="text-[10px] text-rose-500 font-black uppercase animate-pulse flex items-center gap-2"><div className="w-2 h-2 bg-rose-600 rounded-full"></div> Analisando tatame...</div>}
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault(); if (!userQuestion.trim()) return;
              const q = userQuestion; setUserQuestion('');
              setChatMessages(p => [...p, {role:'user', text:q}]);
              setIsAskingAI(true);
              const ans = await askSenseiAI(q, data.students, data.attendance, data.payments);
              setChatMessages(p => [...p, {role:'ai', text: ans || 'OSS! Algo deu errado.'}]);
              setIsAskingAI(false);
            }} className="p-8 border-t border-zinc-800 bg-black/40">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Pergunte ao Sensei..." 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-6 px-8 text-white focus:border-rose-600 outline-none pr-20 font-bold"
                  value={userQuestion}
                  onChange={e => setUserQuestion(e.target.value)}
                />
                <button className="absolute right-3 top-3 bg-white p-4 rounded-xl text-black hover:bg-zinc-200 transition-all active:scale-90"><Send size={22} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configurações Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Ajustes Mestre</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={28} /></button>
            </div>
            <form className="space-y-6" onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setData(p => ({
                ...p,
                settings: {
                  academyName: f.get('academy') as string,
                  accessPassword: f.get('pass') as string
                }
              }));
              setIsSettingsModalOpen(false);
              alert("Configurações salvas! OSS!");
            }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Nome da Academia</label>
                <input name="academy" defaultValue={data.settings.academyName} placeholder="EX: ELITE JIU JITSU" className="w-full bg-zinc-800 p-5 rounded-2xl outline-none focus:border-rose-600 border border-transparent font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Senha do Administrador</label>
                <input name="pass" defaultValue={data.settings.accessPassword} type="password" placeholder="SENHA MESTRE" className="w-full bg-zinc-800 p-5 rounded-2xl outline-none focus:border-rose-600 border border-transparent font-bold tracking-widest" />
              </div>
              <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10">
            <h3 className="text-2xl font-black mb-8 uppercase italic">Cadastrar Professor</h3>
            <form className="space-y-4" onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const n: StaffMember = {
                id: Math.random().toString(36).substr(2, 9),
                name: f.get('name') as string,
                role: f.get('role') as any,
                phone: f.get('phone') as string,
                specialty: f.get('spec') as string,
                bio: '',
                password: f.get('pass') as string,
                active: true
              };
              setData(prev => ({...prev, staff: [...prev.staff, n]}));
              setIsStaffModalOpen(false);
            }}>
              <input name="name" required placeholder="NOME COMPLETO" className="w-full bg-zinc-800 p-5 rounded-2xl outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                <select name="role" className="bg-zinc-800 p-5 rounded-2xl outline-none font-bold"><option>Professor</option><option>Instrutor</option><option>Auxiliar</option></select>
                <input name="pass" required placeholder="SENHA DE LOGIN" className="bg-zinc-800 p-5 rounded-2xl outline-none font-bold" />
              </div>
              <input name="phone" placeholder="WHATSAPP" className="w-full bg-zinc-800 p-5 rounded-2xl outline-none font-bold" />
              <button type="submit" className="w-full bg-rose-600 py-5 rounded-2xl font-bold uppercase tracking-widest mt-4">Autorizar Acesso</button>
            </form>
          </div>
        </div>
      )}

      {/* Mural Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10">
             <div className="flex justify-between mb-8">
               <h3 className="text-2xl font-black uppercase italic">Novo Aviso</h3>
               <button onClick={() => setIsAnnouncementModalOpen(false)}><X size={24} /></button>
             </div>
             <form className="space-y-4" onSubmit={e => {
               e.preventDefault();
               const f = new FormData(e.currentTarget);
               const n: Announcement = {
                 id: Math.random().toString(36).substr(2,9),
                 title: f.get('title') as string,
                 content: f.get('content') as string,
                 category: f.get('cat') as any,
                 date: today
               };
               setData(p => ({...p, announcements: [n, ...p.announcements]}));
               setIsAnnouncementModalOpen(false);
             }}>
                <input name="title" required placeholder="TÍTULO" className="w-full bg-zinc-800 p-5 rounded-2xl outline-none font-bold" />
                <select name="cat" className="w-full bg-zinc-800 p-5 rounded-2xl outline-none font-bold">
                   <option>Geral</option><option>Evento</option><option>Graduação</option><option>Financeiro</option>
                </select>
                <textarea name="content" required placeholder="MENSAGEM..." className="w-full bg-zinc-800 p-5 rounded-2xl outline-none h-32 font-medium" />
                <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-bold uppercase tracking-widest">Publicar Mural</button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
