import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, BuildingStorefrontIcon, PaintBrushIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Configuracoes = () => {
  const [abaAtiva, setAbaAtiva] = useState('loja');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_exibicao: '',
    cnpj: '',
    inscricao_estadual: '',
    email: '',
    telefone: '',
    whatsapp: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    logo: '',
    cor_primaria: '#3B82F6',
    cor_secundaria: '#1E40AF',
    ultimo_numero_nfe: 0
  });

  const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const response = await api.get('/configuracoes');
      const loja = response.data.loja;
      setFormData({
        nome_exibicao: loja.nome_exibicao || '',
        cnpj: loja.cnpj || '',
        inscricao_estadual: loja.inscricao_estadual || '',
        email: loja.email || '',
        telefone: loja.telefone || '',
        whatsapp: loja.whatsapp || '',
        endereco: loja.endereco || '',
        cidade: loja.cidade || '',
        estado: loja.estado || '',
        cep: loja.cep || '',
        logo: loja.logo || '',
        cor_primaria: loja.cor_primaria || '#3B82F6',
        cor_secundaria: loja.cor_secundaria || '#1E40AF',
        ultimo_numero_nfe: loja.ultimo_numero_nfe || 0,
        slug: loja.slug
      });
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.put('/configuracoes', formData);
      toast.success('Configurações salvas');
    } catch (error) {
      toast.error('Erro ao salvar');
    }
    setSalvando(false);
  };

  const handleNumeracaoNfe = async () => {
    try {
      await api.put('/configuracoes/numeracao-nfe', { ultimo_numero: formData.ultimo_numero_nfe });
      toast.success('Numeração atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const formatarCNPJ = (valor) => {
    return valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
  };

  const formatarTelefone = (valor) => {
    return valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
  };

  const formatarCEP = (valor) => {
    return valor.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        <p className="text-gray-600">Configure os dados da sua loja</p>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b flex">
          <button onClick={() => setAbaAtiva('loja')}
            className={`px-6 py-4 font-medium flex items-center border-b-2 ${abaAtiva === 'loja' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <BuildingStorefrontIcon className="h-5 w-5 mr-2" /> Dados da Loja
          </button>
          <button onClick={() => setAbaAtiva('visual')}
            className={`px-6 py-4 font-medium flex items-center border-b-2 ${abaAtiva === 'visual' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <PaintBrushIcon className="h-5 w-5 mr-2" /> Visual
          </button>
          <button onClick={() => setAbaAtiva('nfe')}
            className={`px-6 py-4 font-medium flex items-center border-b-2 ${abaAtiva === 'nfe' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <DocumentTextIcon className="h-5 w-5 mr-2" /> Numeração NF-e
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm p-6">
          
          {/* Dados da Loja */}
          {abaAtiva === 'loja' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja *</label>
                  <input type="text" value={formData.nome_exibicao} onChange={(e) => setFormData({...formData, nome_exibicao: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input type="text" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: formatarCNPJ(e.target.value)})}
                    placeholder="00.000.000/0000-00" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                  <input type="text" value={formData.inscricao_estadual} onChange={(e) => setFormData({...formData, inscricao_estadual: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contato@loja.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: formatarTelefone(e.target.value)})}
                    placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: formatarTelefone(e.target.value)})}
                    placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-800 mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input type="text" value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      placeholder="Rua, número, complemento" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input type="text" value={formData.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="">Selecione...</option>
                      {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input type="text" value={formData.cep} onChange={(e) => setFormData({...formData, cep: formatarCEP(e.target.value)})}
                      placeholder="00000-000" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>

              {formData.slug && (
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-800 mb-2">URL do seu Site</h3>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                      {window.location.origin}/loja/{formData.slug}
                    </code>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/loja/${formData.slug}`); toast.success('Link copiado!'); }}
                      className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">Copiar</button>
                    <a href={`/loja/${formData.slug}`} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Abrir</a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visual */}
          {abaAtiva === 'visual' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (URL)</label>
                <input type="text" value={formData.logo} onChange={(e) => setFormData({...formData, logo: e.target.value})}
                  placeholder="https://exemplo.com/logo.png" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                {formData.logo && (
                  <div className="mt-2">
                    <img src={formData.logo} alt="Preview" className="h-16 object-contain bg-gray-100 rounded p-2" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.cor_primaria} onChange={(e) => setFormData({...formData, cor_primaria: e.target.value})}
                      className="h-10 w-20 rounded cursor-pointer" />
                    <input type="text" value={formData.cor_primaria} onChange={(e) => setFormData({...formData, cor_primaria: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.cor_secundaria} onChange={(e) => setFormData({...formData, cor_secundaria: e.target.value})}
                      className="h-10 w-20 rounded cursor-pointer" />
                    <input type="text" value={formData.cor_secundaria} onChange={(e) => setFormData({...formData, cor_secundaria: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-800 mb-2">Preview</h3>
                <div className="rounded-lg overflow-hidden border">
                  <div className="h-12 flex items-center px-4" style={{ backgroundColor: formData.cor_primaria }}>
                    <span className="text-white font-bold">{formData.nome_exibicao || 'Sua Loja'}</span>
                  </div>
                  <div className="h-8" style={{ backgroundColor: formData.cor_secundaria }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Numeração NF-e */}
          {abaAtiva === 'nfe' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Último Número de NF-e</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={formData.ultimo_numero_nfe} onChange={(e) => setFormData({...formData, ultimo_numero_nfe: parseInt(e.target.value) || 0})}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg" />
                  <button type="button" onClick={handleNumeracaoNfe}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Atualizar</button>
                </div>
                <p className="text-sm text-gray-500 mt-1">A próxima NF-e será: {(formData.ultimo_numero_nfe + 1).toString().padStart(9, '0')}</p>
              </div>
            </div>
          )}

          {/* Botão Salvar */}
          {abaAtiva !== 'nfe' && (
            <div className="border-t mt-6 pt-6 flex justify-end">
              <button type="submit" disabled={salvando}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default Configuracoes;