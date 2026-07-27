/**
 * Textos do encerramento da loja.
 * Fonte unica para o aviso do AuthDrawer e o toast de entrada.
 */

export const STORE_CLOSING_TITLE = 'Estamos encerrando a loja';

export const STORE_CLOSING_AUTH_MESSAGE =
  'Nao estamos aceitando novos cadastros. O acesso segue disponivel apenas para clientes ja cadastrados acompanharem seus pedidos.';

export const STORE_CLOSING_TOAST_MESSAGE =
  'Encerramos os novos cadastros. Seguimos atendendo apenas os pedidos de clientes ja cadastrados.';

/** Chave de sessionStorage: o toast aparece uma vez por sessao do navegador. */
export const STORE_CLOSING_TOAST_SEEN_KEY = 'auricapri_store_closing_notice_seen';
