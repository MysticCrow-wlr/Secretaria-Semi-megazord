import React from "react";
import FooterNine from "../layout/footers/FooterNine";
import PageLinksTwo from "../common/PageLinksTwo";
import PieChartComponent from "./PieCharts";
import { activeUsers, states, timeline } from "@/data/dashboard";
import Charts from "./Charts";
import CalendarTwo from "./calendar/CalenderTwo"; 

// Definição do componente principal do Dashboard 
export default function DshbDashboard() {
  return (
    <div className="dashboard__main">
      <div className="dashboard__content bg-light-4">
        {/* Cabeçalho com Título e Breadcrumbs */}
        <div className="row pb-50 mb-10">
          <div className="col-auto">
            <h1 className="text-30 lh-12 fw-700">Dashboard</h1>
            <PageLinksTwo />
          </div>
        </div>

        {/* Linha principal que divide o layout */}
        <div className="row y-gap-50">
          
          {/* Coluna Principal (Esquerda) - 9 de 12 colunas em telas grandes */}
          <div className="col-xl-9 col-lg-12">
            
            {/* Linha dos cartões de estatística */}
            <div className="row y-gap-30">
              {/* Renderização dinâmica dos 3 primeiros cartões de estatística  */}
              {/* Usa .slice(0, 3) para pegar 3 itens dos dados 'states' e .map() para criar um cartão para cada */}
              {states.slice(0, 3).map((elm, i) => (
                <div key={i} className="col-xl-4 col-md-6">
                  <div className="d-flex justify-between items-center py-35 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                      {/* Título, valor e novo valor vêm dos dados (elm) */}
                      <div className="lh-1 fw-500">{elm.title}</div>
                      <div className="text-24 lh-1 fw-700 text-dark-1 mt-20">
                        ${elm.value}
                      </div>
                      <div className="lh-1 mt-25">
                        <span className="text-purple-1">${elm.new}</span> New
                        Sales
                      </div>
                    </div>
                    {/* Ícone também é dinâmico */}
                    <i className={`text-40 ${elm.iconClass} text-purple-1`}></i>
                  </div>
                </div>
              ))}
            </div>

            {/* Linha dos Gráficos */}
            <div className="row y-gap-30 pt-30">
              {/* Coluna do Gráfico de Visualizações */}
              <div className="col-md-6">
                <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                  {/* Cabeçalho do Gráfico */}
                  <div className="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                    <h2 className="text-17 lh-1 fw-500">Visualizações do Seu Perfil</h2>
                    <div className="text-14">This Week</div>
                  </div>
                  {/*  Renderiza o componente de Gráfico */}
                  <div className="py-40 px-30">
                    <Charts />
                  </div>
                </div>
              </div>

              {/* Coluna do Gráfico de Tráfego (Pizza) */}
              <div className="col-md-6">
                <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                  {/* Cabeçalho do Gráfico */}
                  <div className="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                    <h2 className="text-17 lh-1 fw-500">Tráfego</h2>
                    <div className="">This Week</div>
                  </div>
                   {/* Renderiza o componente de Gráfico de Pizza */}
                  <div className="py-40 px-30">
                    <PieChartComponent />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === Barra Lateral (Direita) - 3 de 12 colunas em telas grandes === */}
          <div className="col-xl-3 col-lg-12">
            <div className="row y-gap-30">
              
              {/* Widget de Perfil (Estático) */}
              <div className="col-12">
                <div className="d-flex items-center flex-column text-center py-40 px-40 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                  <img src="/assets/img/dashboard/demo/1.png" alt="image" />
                  <div className="text-17 fw-500 text-dark-1 mt-20">
                    Student Demo
                  </div>
                  <div className="text-14 lh-1 mt-5">
                    studentdemo1@example.com
                  </div>
                </div>
              </div>

              {/* Widget de Emblemas (Estático) */}
              <div className="col-12">
                {/* Conteúdo do widget de emblemas */}
                <div className="pt-20 pb-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                  <h5 className="text-17 fw-500 mb-20">Latest Badges</h5>
                  {/*  (Imagens dos emblemas)  */}
                </div>
              </div>

              {/* Widget de Usuários Online */}
              <div className="col-12">
                <div className="pt-20 pb-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                  <h5 className="text-17 fw-500">Online Users</h5>
                  <div className="text-14 mt-8">2 usuários online (últimos 12 minutos)</div>
                  
                  {/*  Renderização dinâmica da lista de usuários online  */}
                  <div className="mt-30">
                    <div className="row y-gap-10">
                      {/* Usa .map() nos dados 'activeUsers' para listar cada usuário */}
                      {activeUsers.map((elm, i) => (
                        <div key={i} className="col-12">
                          <div className="d-flex items-center">
                            <div className="shrink-0">
                              <img src={elm.image} alt="badge" />
                            </div>
                            <div className="ml-10">
                              <h6 className="text-14 lh-11 fw-500">
                                {elm.name} {/* Nome dinâmico do usuário */}
                              </h6>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget de Calendário */}
              <div className="col-12">
                <CalendarTwo />
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterNine />
    </div>
  );
}