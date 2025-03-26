import React from 'react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <a href="#dashboard" className="active">Dashboard</a>
      <a href="#base-de-dados">Base de dados</a>
      <a href="#cadastro-posto-detran">Cadastro Posto Detran</a>
      <a href="#cadastro-clinicas">Cadastro Clínicas</a>
      <a href="#cadastro-cfc">Cadastro CFC</a>
      <a href="#usuarios">Usuários</a>
    </div>
  );
};

export default Sidebar;