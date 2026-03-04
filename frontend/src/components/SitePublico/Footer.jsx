import React from 'react';
import { PhoneIcon } from '@heroicons/react/24/outline';

const Footer = ({ loja }) => {
  const corPrimaria = loja?.cor_primaria || '#3B82F6';
  const corSecundaria = loja?.cor_secundaria || '#1E40AF';
  const anoAtual = new Date().getFullYear();

  // Formata número do WhatsApp (remove caracteres e adiciona 55 se necessário)
  const formatarWhatsApp = (numero) => {
    if (!numero) return null;
    let limpo = numero.replace(/\D/g, '');
    if (limpo.length === 10 || limpo.length === 11) {
      limpo = '55' + limpo;
    }
    return limpo;
  };

  const whatsappNumero = formatarWhatsApp(loja?.whatsapp);
  const whatsappLink = whatsappNumero 
    ? `https://api.whatsapp.com/send?phone=${whatsappNumero}&text=${encodeURIComponent('Olá! Vim pelo site e gostaria de mais informações.')}`
    : null;

  return (
    <>
      {/* Botão WhatsApp Flutuante */}
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110"
          title="Fale conosco pelo WhatsApp"
        >
          <svg 
            className="h-6 w-6" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* Footer Principal */}
      <footer 
        className="mt-auto"
        style={{ backgroundColor: corSecundaria }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Coluna 1 - Sobre a Loja */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                {loja?.logo ? (
                  <img 
                    src={loja.logo} 
                    alt={loja.nome_exibicao} 
                    className="h-12 w-auto object-contain bg-white rounded p-1"
                  />
                ) : (
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: corPrimaria }}
                  >
                    {loja?.nome_exibicao?.charAt(0) || 'L'}
                  </div>
                )}
                <span className="text-white font-bold text-xl">
                  {loja?.nome_exibicao || 'Loja'}
                </span>
              </div>
              <p className="text-white/70 text-sm">
                Sua loja de confiança com os melhores produtos e preços.
              </p>
            </div>

            {/* Coluna 2 - Contato */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contato</h3>
              <div className="space-y-2">
                {loja?.telefone && (
                  <a 
                    href={`tel:${loja.telefone}`}
                    className="flex items-center text-white/80 hover:text-white text-sm"
                  >
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {loja.telefone}
                  </a>
                )}
                {loja?.whatsapp && (
                  <a 
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-white/80 hover:text-white text-sm"
                  >
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp: {loja.whatsapp}
                  </a>
                )}
              </div>
            </div>

            {/* Coluna 3 - Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Navegação</h3>
              <div className="space-y-2">
                <a 
                  href={`/loja/${loja?.slug}`}
                  className="block text-white/80 hover:text-white text-sm"
                >
                  Início
                </a>
                <a 
                  href={`/loja/${loja?.slug}/produtos`}
                  className="block text-white/80 hover:text-white text-sm"
                >
                  Todos os Produtos
                </a>
                <a 
                  href={`/loja/${loja?.slug}/carrinho`}
                  className="block text-white/80 hover:text-white text-sm"
                >
                  Meu Carrinho
                </a>
              </div>
            </div>
          </div>

          {/* Linha Divisória */}
          <div className="border-t border-white/20 mt-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <p className="text-white/60 text-xs">
                © {anoAtual} {loja?.nome_exibicao || 'Loja'}. Todos os direitos reservados.
              </p>
              <p className="text-white/40 text-xs">
                Desenvolvido com Sistema ERP Multi-Tenant
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;