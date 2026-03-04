import React, { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const ImportarJSON = () => {
  const [modo, setModo] = useState('arquivo'); // 'arquivo' ou 'texto'
  const [jsonTexto, setJsonTexto] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Exemplo de JSON
  const exemploJSON = `[
  {
    "nome": "Produto Exemplo 1",
    "codigo": "PROD001",
    "marca": "Marca X",
    "categoria": "Eletrônicos",
    "preco": 199.90,
    "preco_custo": 120.00,
    "estoque": 50,
    "estoque_minimo": 5,
    "descricao": "Descrição do produto"
  },
  {
    "nome": "Produto Exemplo 2",
    "codigo": "PROD002",
    "marca": "Marca Y",
    "categoria": "Acessórios",
    "preco": 49.90,
    "preco_custo": 25.00,
    "estoque": 100,
    "estoque_minimo": 10
  }
]`;

  // Processar arquivo JSON
  const handleArquivo = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    if (!arquivo.name.endsWith('.json')) {
      toast.error('Por favor, selecione um arquivo .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target.result;
        validarEProcessarJSON(conteudo);
      } catch (error) {
        toast.error('Erro ao ler arquivo');
      }
    };
    reader.readAsText(arquivo);
  };

  // Validar e processar JSON
  const validarEProcessarJSON = (jsonString) => {
    setLoading(true);
    setProdutos([]);
    setResultado(null);

    try {
      const dados = JSON.parse(jsonString);

      if (!Array.isArray(dados)) {
        toast.error('O JSON deve ser um array de produtos');
        setLoading(false);
        return;
      }

      if (dados.length === 0) {
        toast.error('O JSON está vazio');
        setLoading(false);
        return;
      }

      // Validar cada produto
      const produtosValidados = dados.map((item, index) => {
        const erros = [];
        
        if (!item.nome || item.nome.trim() === '') {
          erros.push('Nome obrigatório');
        }
        if (!item.preco || isNaN(parseFloat(item.preco)) || parseFloat(item.preco) <= 0) {
          erros.push('Preço inválido');
        }
        if (item.estoque !== undefined && (isNaN(parseInt(item.estoque)) || parseInt(item.estoque) < 0)) {
          erros.push('Estoque inválido');
        }

        return {
          id: index + 1,
          nome: item.nome?.trim() || '',
          codigo: item.codigo?.trim() || '',
          marca: item.marca?.trim() || '',
          categoria: item.categoria?.trim() || 'Sem Categoria',
          preco: parseFloat(item.preco) || 0,
          preco_custo: parseFloat(item.preco_custo) || 0,
          estoque: parseInt(item.estoque) || 0,
          estoque_minimo: parseInt(item.estoque_minimo) || 0,
          descricao: item.descricao?.trim() || '',
          valido: erros.length === 0,
          erros: erros,
          selecionado: erros.length === 0
        };
      });

      setProdutos(produtosValidados);
      setProdutosSelecionados(
        produtosValidados.filter(p => p.valido).map(p => p.id)
      );

      const validos = produtosValidados.filter(p => p.valido).length;
      const invalidos = produtosValidados.filter(p => !p.valido).length;

      toast.success(`${validos} produtos válidos encontrados${invalidos > 0 ? `, ${invalidos} com erros` : ''}`);

    } catch (error) {
      console.error('Erro ao processar JSON:', error);
      toast.error('JSON inválido. Verifique o formato.');
    }

    setLoading(false);
  };

  // Toggle seleção de produto
  const toggleProduto = (id) => {
    setProdutosSelecionados(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Selecionar/Desmarcar todos
  const toggleTodos = () => {
    const validos = produtos.filter(p => p.valido).map(p => p.id);
    if (produtosSelecionados.length === validos.length) {
      setProdutosSelecionados([]);
    } else {
      setProdutosSelecionados(validos);
    }
  };

  // Importar produtos
  const handleImportar = async () => {
    if (produtosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }

    setImportando(true);

    try {
      const produtosParaImportar = produtos
        .filter(p => produtosSelecionados.includes(p.id))
        .map(p => ({
          nome: p.nome,
          codigo: p.codigo,
          marca: p.marca,
          categoria: p.categoria,
          preco_venda: p.preco,
          preco_custo: p.preco_custo,
          estoque_atual: p.estoque,
          estoque_minimo: p.estoque_minimo,
          descricao: p.descricao
        }));

      const response = await api.post('/produtos/importar-json', {
        produtos: produtosParaImportar
      });

      setResultado({
        sucesso: true,
        importados: response.data.importados || produtosSelecionados.length,
        categoriasCriadas: response.data.categorias_criadas || []
      });

      toast.success(`${response.data.importados || produtosSelecionados.length} produtos importados com sucesso!`);
      
      // Limpar formulário
      setProdutos([]);
      setProdutosSelecionados([]);
      setJsonTexto('');

    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error(error.response?.data?.erro || 'Erro ao importar produtos');
      setResultado({
        sucesso: false,
        erro: error.response?.data?.erro || 'Erro desconhecido'
      });
    }

    setImportando(false);
  };

  // Limpar tudo
  const limparTudo = () => {
    setProdutos([]);
    setProdutosSelecionados([]);
    setJsonTexto('');
    setResultado(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Importar Produtos</h1>
        <p className="text-gray-600">Importe produtos em massa via arquivo JSON</p>
      </div>

      {/* Resultado da Importação */}
      {resultado && (
        <div className={`mb-6 p-4 rounded-lg ${resultado.sucesso ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {resultado.sucesso ? (
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800">Importação concluída!</h3>
                <p className="text-green-700">{resultado.importados} produtos importados com sucesso.</p>
                {resultado.categoriasCriadas?.length > 0 && (
                  <p className="text-green-600 text-sm mt-1">
                    Categorias criadas: {resultado.categoriasCriadas.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start">
              <XCircleIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Erro na importação</h3>
                <p className="text-red-700">{resultado.erro}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setModo('arquivo')}
              className={`px-6 py-3 font-medium text-sm border-b-2 ${
                modo === 'arquivo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CloudArrowUpIcon className="h-5 w-5 inline mr-2" />
              Upload de Arquivo
            </button>
            <button
              onClick={() => setModo('texto')}
              className={`px-6 py-3 font-medium text-sm border-b-2 ${
                modo === 'texto'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Colar JSON
            </button>
          </nav>
        </div>

        <div className="p-6">
          {modo === 'arquivo' ? (
            /* Upload de Arquivo */
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Arraste um arquivo .json ou clique para selecionar</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleArquivo}
                  className="hidden"
                  id="arquivo-json"
                />
                <label
                  htmlFor="arquivo-json"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
                >
                  Selecionar Arquivo
                </label>
              </div>
            </div>
          ) : (
            /* Colar JSON */
            <div>
              <textarea
                value={jsonTexto}
                onChange={(e) => setJsonTexto(e.target.value)}
                placeholder="Cole o JSON aqui..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setJsonTexto(exemploJSON)}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Carregar exemplo
                </button>
                <button
                  onClick={() => validarEProcessarJSON(jsonTexto)}
                  disabled={!jsonTexto.trim() || loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Validando...' : 'Validar JSON'}
                </button>
              </div>
            </div>
          )}

          {/* Formato esperado */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Formato esperado:</h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`[
  {
    "nome": "Nome do Produto",      // Obrigatório
    "codigo": "COD001",             // Opcional (código interno)
    "marca": "Marca X",             // Opcional
    "categoria": "Eletrônicos",     // Opcional (cria se não existir)
    "preco": 199.90,                // Obrigatório
    "preco_custo": 120.00,          // Opcional
    "estoque": 50,                  // Opcional (default: 0)
    "estoque_minimo": 5,            // Opcional (default: 0)
    "descricao": "Descrição..."     // Opcional
  }
]`}
            </pre>
          </div>
        </div>
      </div>

      {/* Preview dos Produtos */}
      {produtos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">
                Preview: {produtos.length} produtos encontrados
              </h3>
              <p className="text-sm text-gray-500">
                {produtosSelecionados.length} selecionados para importação
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleTodos}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {produtosSelecionados.length === produtos.filter(p => p.valido).length
                  ? 'Desmarcar Todos'
                  : 'Selecionar Todos'}
              </button>
              <button
                onClick={limparTudo}
                className="px-3 py-1 text-sm text-red-500 border border-red-300 rounded hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 inline mr-1" />
                Limpar
              </button>
            </div>
          </div>

          {/* Tabela de produtos */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={produtosSelecionados.length === produtos.filter(p => p.valido).length}
                      onChange={toggleTodos}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {produtos.map((produto) => (
                  <tr 
                    key={produto.id} 
                    className={`${!produto.valido ? 'bg-red-50' : produtosSelecionados.includes(produto.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={produtosSelecionados.includes(produto.id)}
                        onChange={() => toggleProduto(produto.id)}
                        disabled={!produto.valido}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {produto.valido ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="flex items-center">
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                          <span className="text-xs text-red-600">{produto.erros.join(', ')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{produto.nome || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{produto.codigo || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{produto.marca || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {produto.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      R$ {produto.preco.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{produto.estoque}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botão de Importar */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {produtosSelecionados.length} produtos serão importados
              </p>
              <button
                onClick={handleImportar}
                disabled={produtosSelecionados.length === 0 || importando}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center"
              >
                {importando ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Confirmar Importação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportarJSON;