import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Wifi, Globe, Smartphone, Laptop, Info, Sparkles, ShieldCheck } from 'lucide-react';

export function ShareModal({ onClose }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState('');

  useEffect(() => {
    const fetchInfo = () => {
      fetch('/api/network-info')
        .then((res) => res.json())
        .then((data) => setNetworkInfo(data))
        .catch((err) => console.error('Erro ao buscar dados de rede:', err));
    };

    fetchInfo();
    // Re-tentar após 3s para pegar o link do túnel caso ainda estivesse inicializando
    const timer = setTimeout(fetchInfo, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(''), 2500);
  };

  const port = networkInfo?.port || window.location.port || 3000;
  const localIps = networkInfo?.localIps || [];
  const publicUrl = networkInfo?.publicUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 space-y-5">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Conectar Colegas de Trabalho</h3>
              <p className="text-xs text-slate-500">Envie o link para a sua equipe acessar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Destaque: Link Web Global (Funciona em QUALQUER rede, Wi-Fi ou Celular) */}
        {publicUrl ? (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Link Direto da Equipe (Recomendado):</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Seguro & Online
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-mono font-bold text-blue-950 truncate select-all">
                {publicUrl}
              </div>
              <button
                onClick={() => handleCopy(publicUrl)}
                className={`inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold rounded-xl transition shrink-0 ${
                  copiedUrl === publicUrl
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                }`}
              >
                {copiedUrl === publicUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl === publicUrl ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600">
              💡 Este link funciona de <strong>qualquer computador</strong> (no trabalho, em casa ou no celular), mesmo que a rede da empresa bloqueie conexões locais.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-2 text-xs text-blue-700">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Gerando link web global seguro... (aguarde 3 segundos)</span>
          </div>
        )}

        {/* 2. Links na Rede Local */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ou acesse pelo IP da Rede Local:
          </p>

          {localIps.map((item, idx) => {
            const url = `http://${item.address}:${port}`;
            const isCopied = copiedUrl === url;

            return (
              <div
                key={idx}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-600">{item.interface}: </span>
                  <span className="font-mono text-slate-800 select-all">{url}</span>
                </div>
                <button
                  onClick={() => handleCopy(url)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
                  title="Copiar"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Instruções */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-600">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Dica rápida:
          </div>
          <p>
            Basta dar <strong>Ctrl + V</strong> no WhatsApp ou Teams da sua equipe. Eles não precisam instalar nada nem criar conta!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
