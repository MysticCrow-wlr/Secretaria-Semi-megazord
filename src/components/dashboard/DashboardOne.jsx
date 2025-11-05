import React, { useState, useEffect, useCallback } from "react";
import FooterNine from "../layout/footers/FooterNine";
import api from "@/api/axios"; 

// -----------------------------------------------------------------
// FUNÇÃO HELPER PARA PEGAR OS HEADERS DE AUTENTICAÇÃO
// -----------------------------------------------------------------
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.error("Token de autenticação não encontrado.");
        return null;
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

// -----------------------------------------------------------------
// FUNÇÃO HELPER PARA PEGAR O NOME FORMATADO (CORRIGIDA)
// -----------------------------------------------------------------
const getNomeFormatado = (aluno) => {
    if (aluno.name_aluno) return aluno.name_aluno;

    // 2. Fallbacks
    if (aluno.nome) return aluno.nome;
    
    const primeiro = aluno.first_name || aluno.primeiro_nome;
    const ultimo = aluno.last_name || aluno.ultimo_nome;

    if (primeiro) {
        return `${primeiro} ${ultimo || ''}`.trim();
    }
    
    //Fallback final
    return 'Nome Indisponível';
};
// -----------------------------------------------------------------


export default function DashboardOne() {
    // --- ESTADOS GLOBAIS DE DADOS E STATUS ---
    const [alunos, setAlunos] = useState([]);
    const [totalAlunos, setTotalAlunos] = useState(0);
    const [ativos, setAtivos] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null); 

    // -----------------------------------------------------------------
    // LÓGICA DE BUSCA DE DADOS
    // -----------------------------------------------------------------
    const fetchAlunos = useCallback(async () => {
        setLoading(true);
        setError(null);
        const headers = getAuthHeaders();
        if (!headers) {
            setLoading(false);
            setError("Token ausente. Faça login novamente.");
            return;
        }

        try {
            const res = await api.get("/alunos/", { headers });
            const alunosData = Array.isArray(res.data) ? res.data : res.data.results || [];
            const total = alunosData.length;
            const ativosCount = alunosData.filter(a => a.ativo).length; 

            setAlunos(alunosData);
            setTotalAlunos(total);
            setAtivos(ativosCount);

        } catch (err) {
            console.error("Erro ao buscar dados de alunos:", err.response?.data || err);
            setError("Falha ao carregar dados. (Verifique o console para detalhes)");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlunos();
    }, [fetchAlunos]);
    
    // --- CÁLCULOS DERIVADOS ---
    const evadidos = totalAlunos - ativos;
    const taxaEvasao = totalAlunos > 0 ? ((evadidos / totalAlunos) * 100).toFixed(2) : '0.00';


    // -----------------------------------------------------------------
    // LÓGICA DE ATUALIZAÇÃO (Foi ajustada)
    // -----------------------------------------------------------------
    const handleToggleAtivo = async (aluno) => {
        const novoStatus = !aluno.ativo; 
        const nomeAluno = getNomeFormatado(aluno);
        const acao = novoStatus ? "ATIVO" : "EVADIDO";

        // Validação 
        if (aluno.Responsavel === undefined || aluno.Responsavel === null) {
            console.error(`O objeto 'aluno' (ID: ${aluno.id}, Nome: ${nomeAluno}) está sem o campo 'Responsavel'. O PATCH (atualização) provavelmente falhará.`);
            alert(`Erro Crítico: O campo 'Responsavel' não foi encontrado para ${nomeAluno}. A API não permite esta atualização. (Verifique o console)`);
            return;
        }

        const confirmacao = window.confirm(`Tem certeza que deseja marcar ${nomeAluno} como ${acao}?`);
        if (!confirmacao) return;

        setUpdatingId(aluno.id);
        const headers = getAuthHeaders();
        
        // Foi feito o payload completo
        const payload = {
            Responsavel: aluno.Responsavel,
            ativo: novoStatus                 
        };
        // -------------------------------------

        try {
            await api.patch(`/alunos/${aluno.id}/`, payload, { headers });

            alert(`${nomeAluno} foi marcado como ${acao} com sucesso!`);
            fetchAlunos(); // Recarrega os dados

        } catch (err) {
            console.error(`Erro ao marcar ${nomeAluno} como ${acao}:`, err.response?.data || err);
            const apiError = err.response?.data?.Responsavel || err.response?.data?.detail || "A API rejeitou a atualização.";
            alert(`Erro ao atualizar ${nomeAluno}: ${apiError}`);
        } finally {
            setUpdatingId(null);
        }
    };

    // -----------------------------------------------------------------
    // FUNÇÃO PARA RENDERIZAR O CARD DE RESUMO DE EVASÃO
    // -----------------------------------------------------------------
    const renderEvasaoCard = () => {
        return (
            <div className="d-flex justify-between items-center py-35 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div>
                    <div className="lh-1 fw-500">Taxa de Evasão Atual</div>
                    <div className={`text-32 lh-1 fw-700 mt-20 ${taxaEvasao > 0 ? 'text-red-1' : 'text-dark-1'}`}>
                        {taxaEvasao}%
                    </div>
                    <div className="lh-1 mt-25">
                        <span className="text-red-1">{evadidos}</span> Evadidos / {ativos} Ativos / {totalAlunos} Total
                    </div>
                </div>
                <i className="text-40 icon-user-x text-red-1"></i> 
            </div>
        );
    };

    // -----------------------------------------------------------------
    // RENDERIZAÇÃO PRINCIPAL
    // -----------------------------------------------------------------
    return (
        <div className="dashboard__main">
            <div className="dashboard__content bg-light-4">
                <div className="row pb-50 mb-10">
                    <div className="col-auto">
                        <h1 className="text-30 lh-12 fw-700">Painel de Controle de Evasão</h1>
                        <div className="mt-10">
                            Monitore o status dos alunos e registre as saídas.
                        </div>
                    </div>
                </div>

                {/* CARD DE RESUMO */}
                <div className="row y-gap-30">
                    <div className="col-xl-4 col-md-6">
                        {loading ? (
                            <div className="py-35 px-30 bg-white shadow-4 rounded-16">Carregando resumo...</div>
                        ) : error ? (
                            <div className="py-35 px-30 bg-red-1 shadow-4 rounded-16 text-white">{error}</div>
                        ) : (
                            renderEvasaoCard()
                        )}
                    </div>
                </div>
                
                {/* TABELA DE ALUNOS */}
                <div className="row y-gap-30 pt-30">
                    <div className="col-12">
                        <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 p-30">
                            <h2 className="text-17 lh-1 fw-500 mb-20 text-green-1">Gerenciamento de Status de Alunos</h2>

                            {loading && !alunos.length && <div className="text-center py-50">Carregando lista de alunos...</div>}
                            {error && !loading && <div className="text-red-1">Não foi possível carregar a lista.</div>}

                            {!loading && !error && (
                                <div className="dashboard-table">
                                    {/* Cabeçalho da Tabela */}
                                    <div className="d-flex items-center text-15 fw-500 text-orange-1 bg-light-3 rounded-8 px-20 py-15 mb-10">
                                        <div style={{ width: '40%' }}>Nome do Aluno</div>
                                        <div style={{ width: '20%' }}>Status</div>
                                        <div style={{ width: '40%' }}>Ações</div>
                                    </div>

                                    {/* Corpo da Tabela */}
                                    {alunos.map((aluno) => {
                                        
                                        // Função foi corrigida
                                        const nomeDisplay = getNomeFormatado(aluno); 
                                        const isUpdating = updatingId === aluno.id;
                                        
                                        return (
                                            <div key={aluno.id} className="d-flex items-center border-bottom-light px-20 py-15">
                                                {/* NOME DO ALUNO */}
                                                <div style={{ width: '40%' }}>{nomeDisplay}</div>
                                                
                                                {/* STATUS */}
                                                <div style={{ width: '20%' }}>
                                                    <span className={`status-tag fw-500 ${aluno.ativo ? 'text-green-1' : 'text-red-1'}`}>
                                                        {aluno.ativo ? 'Ativo' : 'Evadido'}
                                                    </span>
                                                </div>
                                                
                                                {/* BOTÃO DE AÇÃO */}
                                                <div style={{ width: '40%' }}>
                                                    <button
                                                        onClick={() => handleToggleAtivo(aluno)} 
                                                        className={`button -sm ${aluno.ativo ? '-red-3' : '-green-3'} text-dark-1`}
                                                        disabled={isUpdating || loading}
                                                    >
                                                        {isUpdating ? 'Atualizando...' : (aluno.ativo ? 'Marcar como Evadido' : 'Marcar como Ativo')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <FooterNine />
        </div>
    );
}