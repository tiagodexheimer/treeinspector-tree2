"use client";

import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "@/app/actions/user";
import { Plus, Edit2, Trash2, ShieldCheck, User as UserIcon, X, Loader2, Search, Mail, Key } from "lucide-react";
import { Role } from "@prisma/client";

export default function UsersAdmin() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "OPERACIONAL" as Role,
        active: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (user: any = null) => {
        setCurrentUser(user);
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email,
                password: "", // Don't show password
                role: user.role,
                active: user.active,
            });
        } else {
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "OPERACIONAL",
                active: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (currentUser) {
                await updateUser(currentUser.id, formData);
            } else {
                await createUser(formData);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este usuário?")) {
            try {
                await deleteUser(id);
                fetchUsers();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-emerald-600" />
                        Gestão de Utilizadores
                    </h1>
                    <p className="mt-2 text-slate-500">Configure os acessos e papéis da equipa do TreeInspector</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Novo Utilizador
                </button>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <input
                    type="text"
                    placeholder="Pesquisar por nome ou e-mail..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                        <p className="text-slate-500 font-medium italic">A carregar listagem...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Utilizador</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Papel (Role)</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                                                    {user.name?.charAt(0) || user.email.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{user.name || "Sem nome"}</div>
                                                    <div className="text-xs text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'GESTOR' ? 'bg-blue-100 text-blue-700' :
                                                        user.role === 'INSPETOR' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${user.active ? 'text-emerald-600' : 'text-red-500'}`}>
                                                <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-600' : 'bg-red-500'}`}></span>
                                                {user.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(user)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl shadow-slate-900/50 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">
                                {currentUser ? "Editar Utilizador" : "Novo Utilizador"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Nome</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Nome completo"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="email"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="exemplo@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">
                                        {currentUser ? "Senha (deixe em branco para manter)" : "Senha"}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="password"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            required={!currentUser}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Papel (Role)</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                                    >
                                        <option value="ADMIN">ADMIN (Acesso Total)</option>
                                        <option value="GESTOR">GESTOR (Supervisão)</option>
                                        <option value="INSPETOR">INSPETOR (Técnico)</option>
                                        <option value="OPERACIONAL">OPERACIONAL (Execução)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-dotted border-slate-200">
                                <input
                                    type="checkbox"
                                    id="active"
                                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                />
                                <label htmlFor="active" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                                    Utilizador Ativo (Pode fazer login)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-10 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Alterações"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
