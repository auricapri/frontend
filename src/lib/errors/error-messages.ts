import { ErrorCode, ErrorCategory } from './error-codes';

export type Locale = 'pt' | 'en' | 'es';

interface LocalizedMessage {
  pt: string;
  en: string;
  es: string;
}

export const ErrorMessages: Record<ErrorCode, LocalizedMessage> = {
  // Generic
  [ErrorCode.UNKNOWN_ERROR]: {
    pt: 'Ocorreu um erro inesperado. Tente novamente.',
    en: 'An unexpected error occurred. Please try again.',
    es: 'Ocurrió un error inesperado. Inténtelo de nuevo.',
  },
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    pt: 'Erro interno do servidor. Tente novamente em alguns instantes.',
    en: 'Internal server error. Please try again in a few moments.',
    es: 'Error interno del servidor. Inténtelo de nuevo en unos momentos.',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    pt: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
    en: 'Service temporarily unavailable. Please try again later.',
    es: 'Servicio temporalmente no disponible. Inténtelo más tarde.',
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    pt: 'Muitas tentativas. Aguarde alguns minutos.',
    en: 'Too many attempts. Please wait a few minutes.',
    es: 'Demasiados intentos. Espere unos minutos.',
  },
  [ErrorCode.MAINTENANCE_MODE]: {
    pt: 'Sistema em manutenção. Voltamos em breve!',
    en: 'System under maintenance. We will be back soon!',
    es: '¡Sistema en mantenimiento. Volveremos pronto!',
  },
  [ErrorCode.INVALID_REQUEST]: {
    pt: 'Requisição inválida. Verifique os dados informados.',
    en: 'Invalid request. Please check the provided data.',
    es: 'Solicitud inválida. Verifique los datos proporcionados.',
  },
  [ErrorCode.VALIDATION_ERROR]: {
    pt: 'Dados inválidos. Verifique as informações e tente novamente.',
    en: 'Invalid data. Please check the information and try again.',
    es: 'Datos inválidos. Verifique la información e inténtelo de nuevo.',
  },
  [ErrorCode.NOT_FOUND]: {
    pt: 'Recurso não encontrado.',
    en: 'Resource not found.',
    es: 'Recurso no encontrado.',
  },

  // Auth
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    pt: 'Email ou senha incorretos.',
    en: 'Invalid email or password.',
    es: 'Email o contraseña incorrectos.',
  },
  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    pt: 'Sua sessão expirou. Por favor, faça login novamente.',
    en: 'Your session has expired. Please log in again.',
    es: 'Su sesión ha expirado. Por favor, inicie sesión de nuevo.',
  },
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    pt: 'Sessão inválida. Por favor, faça login novamente.',
    en: 'Invalid session. Please log in again.',
    es: 'Sesión inválida. Por favor, inicie sesión de nuevo.',
  },
  [ErrorCode.AUTH_TOKEN_MISSING]: {
    pt: 'É necessário estar logado para acessar este recurso.',
    en: 'You must be logged in to access this resource.',
    es: 'Debe iniciar sesión para acceder a este recurso.',
  },
  [ErrorCode.AUTH_EMAIL_NOT_CONFIRMED]: {
    pt: 'Email não confirmado. Verifique sua caixa de entrada.',
    en: 'Email not confirmed. Please check your inbox.',
    es: 'Email no confirmado. Revise su bandeja de entrada.',
  },
  [ErrorCode.AUTH_USER_DISABLED]: {
    pt: 'Sua conta foi desativada. Entre em contato com o suporte.',
    en: 'Your account has been disabled. Please contact support.',
    es: 'Su cuenta ha sido desactivada. Contacte con soporte.',
  },
  [ErrorCode.AUTH_SESSION_EXPIRED]: {
    pt: 'Sua sessão expirou. Por favor, faça login novamente.',
    en: 'Your session has expired. Please log in again.',
    es: 'Su sesión ha expirado. Por favor, inicie sesión de nuevo.',
  },
  [ErrorCode.AUTH_OAUTH_FAILED]: {
    pt: 'Falha na autenticação social. Tente novamente.',
    en: 'Social authentication failed. Please try again.',
    es: 'La autenticación social falló. Inténtelo de nuevo.',
  },
  [ErrorCode.AUTH_MFA_REQUIRED]: {
    pt: 'Verificação em duas etapas necessária.',
    en: 'Two-factor authentication required.',
    es: 'Se requiere autenticación de dos factores.',
  },
  [ErrorCode.AUTH_MFA_INVALID]: {
    pt: 'Código de verificação inválido.',
    en: 'Invalid verification code.',
    es: 'Código de verificación inválido.',
  },
  [ErrorCode.AUTH_PASSWORD_WEAK]: {
    pt: 'A senha deve ter pelo menos 6 caracteres.',
    en: 'Password must be at least 6 characters.',
    es: 'La contraseña debe tener al menos 6 caracteres.',
  },
  [ErrorCode.AUTH_PASSWORD_RESET_EXPIRED]: {
    pt: 'Link de redefinição de senha expirado. Solicite um novo.',
    en: 'Password reset link expired. Please request a new one.',
    es: 'El enlace de restablecimiento de contraseña expiró. Solicite uno nuevo.',
  },

  // Authorization
  [ErrorCode.FORBIDDEN]: {
    pt: 'Você não tem permissão para realizar esta ação.',
    en: 'You do not have permission to perform this action.',
    es: 'No tiene permiso para realizar esta acción.',
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    pt: 'Permissões insuficientes para esta operação.',
    en: 'Insufficient permissions for this operation.',
    es: 'Permisos insuficientes para esta operación.',
  },
  [ErrorCode.RESOURCE_ACCESS_DENIED]: {
    pt: 'Acesso negado a este recurso.',
    en: 'Access denied to this resource.',
    es: 'Acceso denegado a este recurso.',
  },
  [ErrorCode.ADMIN_ONLY]: {
    pt: 'Esta funcionalidade é restrita a administradores.',
    en: 'This feature is restricted to administrators.',
    es: 'Esta función está restringida a administradores.',
  },
  [ErrorCode.OWNER_ONLY]: {
    pt: 'Apenas o proprietário pode realizar esta ação.',
    en: 'Only the owner can perform this action.',
    es: 'Solo el propietario puede realizar esta acción.',
  },

  // User
  [ErrorCode.USER_NOT_FOUND]: {
    pt: 'Usuário não encontrado.',
    en: 'User not found.',
    es: 'Usuario no encontrado.',
  },
  [ErrorCode.USER_ALREADY_EXISTS]: {
    pt: 'Este usuário já está cadastrado.',
    en: 'This user is already registered.',
    es: 'Este usuario ya está registrado.',
  },
  [ErrorCode.USER_EMAIL_IN_USE]: {
    pt: 'Este email já está em uso.',
    en: 'This email is already in use.',
    es: 'Este email ya está en uso.',
  },
  [ErrorCode.USER_PHONE_IN_USE]: {
    pt: 'Este telefone já está em uso.',
    en: 'This phone number is already in use.',
    es: 'Este teléfono ya está en uso.',
  },
  [ErrorCode.USER_CPF_IN_USE]: {
    pt: 'Este CPF já está cadastrado.',
    en: 'This CPF is already registered.',
    es: 'Este CPF ya está registrado.',
  },
  [ErrorCode.USER_INVALID_CPF]: {
    pt: 'CPF inválido.',
    en: 'Invalid CPF.',
    es: 'CPF inválido.',
  },
  [ErrorCode.USER_PROFILE_INCOMPLETE]: {
    pt: 'Complete seu perfil para continuar.',
    en: 'Complete your profile to continue.',
    es: 'Complete su perfil para continuar.',
  },
  [ErrorCode.USER_ADDRESS_NOT_FOUND]: {
    pt: 'Endereço não encontrado.',
    en: 'Address not found.',
    es: 'Dirección no encontrada.',
  },
  [ErrorCode.USER_ADDRESS_INVALID]: {
    pt: 'Endereço inválido. Verifique os dados.',
    en: 'Invalid address. Please check the data.',
    es: 'Dirección inválida. Verifique los datos.',
  },

  // Product
  [ErrorCode.PRODUCT_NOT_FOUND]: {
    pt: 'Produto não encontrado.',
    en: 'Product not found.',
    es: 'Producto no encontrado.',
  },
  [ErrorCode.PRODUCT_INACTIVE]: {
    pt: 'Este produto não está mais disponível.',
    en: 'This product is no longer available.',
    es: 'Este producto ya no está disponible.',
  },
  [ErrorCode.PRODUCT_OUT_OF_STOCK]: {
    pt: 'Produto esgotado.',
    en: 'Product out of stock.',
    es: 'Producto agotado.',
  },
  [ErrorCode.PRODUCT_VARIANT_NOT_FOUND]: {
    pt: 'Variação do produto não encontrada.',
    en: 'Product variant not found.',
    es: 'Variante del producto no encontrada.',
  },
  [ErrorCode.PRODUCT_VARIANT_INACTIVE]: {
    pt: 'Esta variação não está mais disponível.',
    en: 'This variant is no longer available.',
    es: 'Esta variante ya no está disponible.',
  },
  [ErrorCode.PRODUCT_INVALID_PRICE]: {
    pt: 'Preço do produto inválido.',
    en: 'Invalid product price.',
    es: 'Precio del producto inválido.',
  },
  [ErrorCode.PRODUCT_INVALID_STOCK]: {
    pt: 'Quantidade de estoque inválida.',
    en: 'Invalid stock quantity.',
    es: 'Cantidad de stock inválida.',
  },
  [ErrorCode.PRODUCT_SKU_DUPLICATE]: {
    pt: 'Este SKU já está em uso.',
    en: 'This SKU is already in use.',
    es: 'Este SKU ya está en uso.',
  },
  [ErrorCode.PRODUCT_IMAGE_UPLOAD_FAILED]: {
    pt: 'Falha ao carregar imagem do produto.',
    en: 'Failed to upload product image.',
    es: 'Error al cargar la imagen del producto.',
  },
  [ErrorCode.PRODUCT_CATEGORY_NOT_FOUND]: {
    pt: 'Categoria não encontrada.',
    en: 'Category not found.',
    es: 'Categoría no encontrada.',
  },
  [ErrorCode.PRODUCT_COLLECTION_NOT_FOUND]: {
    pt: 'Coleção não encontrada.',
    en: 'Collection not found.',
    es: 'Colección no encontrada.',
  },

  // Cart
  [ErrorCode.CART_EMPTY]: {
    pt: 'Seu carrinho está vazio.',
    en: 'Your cart is empty.',
    es: 'Su carrito está vacío.',
  },
  [ErrorCode.CART_ITEM_NOT_FOUND]: {
    pt: 'Item não encontrado no carrinho.',
    en: 'Item not found in cart.',
    es: 'Artículo no encontrado en el carrito.',
  },
  [ErrorCode.CART_ITEM_QUANTITY_INVALID]: {
    pt: 'Quantidade inválida.',
    en: 'Invalid quantity.',
    es: 'Cantidad inválida.',
  },
  [ErrorCode.CART_ITEM_EXCEEDS_STOCK]: {
    pt: 'Quantidade solicitada excede o estoque disponível.',
    en: 'Requested quantity exceeds available stock.',
    es: 'La cantidad solicitada excede el stock disponible.',
  },
  [ErrorCode.CART_ITEM_PRICE_CHANGED]: {
    pt: 'O preço de um item foi alterado. Por favor, revise seu carrinho.',
    en: 'The price of an item has changed. Please review your cart.',
    es: 'El precio de un artículo ha cambiado. Por favor, revise su carrito.',
  },
  [ErrorCode.CART_SYNC_FAILED]: {
    pt: 'Falha ao sincronizar carrinho. Tente novamente.',
    en: 'Failed to sync cart. Please try again.',
    es: 'Error al sincronizar el carrito. Inténtelo de nuevo.',
  },
  [ErrorCode.CART_MERGE_FAILED]: {
    pt: 'Falha ao mesclar carrinhos.',
    en: 'Failed to merge carts.',
    es: 'Error al fusionar carritos.',
  },

  // Order
  [ErrorCode.ORDER_NOT_FOUND]: {
    pt: 'Pedido não encontrado.',
    en: 'Order not found.',
    es: 'Pedido no encontrado.',
  },
  [ErrorCode.ORDER_ALREADY_CANCELLED]: {
    pt: 'Este pedido já foi cancelado.',
    en: 'This order has already been cancelled.',
    es: 'Este pedido ya ha sido cancelado.',
  },
  [ErrorCode.ORDER_CANNOT_BE_CANCELLED]: {
    pt: 'Este pedido não pode mais ser cancelado.',
    en: 'This order can no longer be cancelled.',
    es: 'Este pedido ya no puede ser cancelado.',
  },
  [ErrorCode.ORDER_INVALID_STATUS_TRANSITION]: {
    pt: 'Transição de status inválida.',
    en: 'Invalid status transition.',
    es: 'Transición de estado inválida.',
  },
  [ErrorCode.ORDER_ITEMS_UNAVAILABLE]: {
    pt: 'Alguns itens do pedido não estão mais disponíveis.',
    en: 'Some order items are no longer available.',
    es: 'Algunos artículos del pedido ya no están disponibles.',
  },
  [ErrorCode.ORDER_MINIMUM_NOT_MET]: {
    pt: 'Valor mínimo do pedido não atingido.',
    en: 'Minimum order value not met.',
    es: 'Valor mínimo del pedido no alcanzado.',
  },
  [ErrorCode.ORDER_ADDRESS_REQUIRED]: {
    pt: 'Endereço de entrega é obrigatório.',
    en: 'Delivery address is required.',
    es: 'La dirección de entrega es obligatoria.',
  },
  [ErrorCode.ORDER_SHIPPING_REQUIRED]: {
    pt: 'Selecione uma forma de envio.',
    en: 'Please select a shipping method.',
    es: 'Seleccione un método de envío.',
  },
  [ErrorCode.ORDER_REVIEW_NOT_FOUND]: {
    pt: 'Avaliação não encontrada.',
    en: 'Review not found.',
    es: 'Reseña no encontrada.',
  },
  [ErrorCode.ORDER_ALREADY_REVIEWED]: {
    pt: 'Você já avaliou este pedido.',
    en: 'You have already reviewed this order.',
    es: 'Ya ha reseñado este pedido.',
  },
  [ErrorCode.ORDER_TRACKING_UNAVAILABLE]: {
    pt: 'Rastreamento não disponível para este pedido.',
    en: 'Tracking not available for this order.',
    es: 'Seguimiento no disponible para este pedido.',
  },

  // Payment
  [ErrorCode.PAYMENT_FAILED]: {
    pt: 'Pagamento falhou. Tente novamente.',
    en: 'Payment failed. Please try again.',
    es: 'El pago falló. Inténtelo de nuevo.',
  },
  [ErrorCode.PAYMENT_DECLINED]: {
    pt: 'Pagamento recusado. Verifique os dados do cartão.',
    en: 'Payment declined. Please check your card details.',
    es: 'Pago rechazado. Verifique los datos de la tarjeta.',
  },
  [ErrorCode.PAYMENT_CARD_INVALID]: {
    pt: 'Dados do cartão inválidos.',
    en: 'Invalid card details.',
    es: 'Datos de tarjeta inválidos.',
  },
  [ErrorCode.PAYMENT_CARD_EXPIRED]: {
    pt: 'Cartão expirado.',
    en: 'Card expired.',
    es: 'Tarjeta expirada.',
  },
  [ErrorCode.PAYMENT_INSUFFICIENT_FUNDS]: {
    pt: 'Saldo insuficiente.',
    en: 'Insufficient funds.',
    es: 'Fondos insuficientes.',
  },
  [ErrorCode.PAYMENT_FRAUD_DETECTED]: {
    pt: 'Transação não autorizada por motivos de segurança.',
    en: 'Transaction not authorized for security reasons.',
    es: 'Transacción no autorizada por motivos de seguridad.',
  },
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: {
    pt: 'Erro no processador de pagamentos. Tente novamente.',
    en: 'Payment processor error. Please try again.',
    es: 'Error en el procesador de pagos. Inténtelo de nuevo.',
  },
  [ErrorCode.PAYMENT_PIX_EXPIRED]: {
    pt: 'O PIX expirou. Gere um novo código.',
    en: 'PIX has expired. Generate a new code.',
    es: 'El PIX expiró. Genere un nuevo código.',
  },
  [ErrorCode.PAYMENT_BOLETO_EXPIRED]: {
    pt: 'O boleto expirou. Gere um novo.',
    en: 'Boleto has expired. Generate a new one.',
    es: 'El boleto expiró. Genere uno nuevo.',
  },
  [ErrorCode.PAYMENT_REFUND_FAILED]: {
    pt: 'Falha ao processar reembolso.',
    en: 'Failed to process refund.',
    es: 'Error al procesar el reembolso.',
  },
  [ErrorCode.PAYMENT_METHOD_UNAVAILABLE]: {
    pt: 'Método de pagamento indisponível.',
    en: 'Payment method unavailable.',
    es: 'Método de pago no disponible.',
  },

  // Coupon
  [ErrorCode.COUPON_NOT_FOUND]: {
    pt: 'Cupom não encontrado.',
    en: 'Coupon not found.',
    es: 'Cupón no encontrado.',
  },
  [ErrorCode.COUPON_EXPIRED]: {
    pt: 'Este cupom expirou.',
    en: 'This coupon has expired.',
    es: 'Este cupón ha expirado.',
  },
  [ErrorCode.COUPON_INACTIVE]: {
    pt: 'Este cupom não está ativo.',
    en: 'This coupon is not active.',
    es: 'Este cupón no está activo.',
  },
  [ErrorCode.COUPON_ALREADY_USED]: {
    pt: 'Você já utilizou este cupom.',
    en: 'You have already used this coupon.',
    es: 'Ya ha utilizado este cupón.',
  },
  [ErrorCode.COUPON_MINIMUM_NOT_MET]: {
    pt: 'Valor mínimo não atingido para usar este cupom.',
    en: 'Minimum value not met for this coupon.',
    es: 'Valor mínimo no alcanzado para este cupón.',
  },
  [ErrorCode.COUPON_PRODUCT_NOT_ELIGIBLE]: {
    pt: 'Este cupom não é válido para os produtos selecionados.',
    en: 'This coupon is not valid for the selected products.',
    es: 'Este cupón no es válido para los productos seleccionados.',
  },
  [ErrorCode.COUPON_USAGE_LIMIT_REACHED]: {
    pt: 'Limite de uso deste cupom atingido.',
    en: 'Usage limit for this coupon reached.',
    es: 'Límite de uso de este cupón alcanzado.',
  },
  [ErrorCode.COUPON_CODE_DUPLICATE]: {
    pt: 'Já existe um cupom com este código.',
    en: 'A coupon with this code already exists.',
    es: 'Ya existe un cupón con este código.',
  },

  // Shipping
  [ErrorCode.SHIPPING_ADDRESS_INVALID]: {
    pt: 'Endereço de entrega inválido.',
    en: 'Invalid delivery address.',
    es: 'Dirección de entrega inválida.',
  },
  [ErrorCode.SHIPPING_CEP_NOT_FOUND]: {
    pt: 'CEP não encontrado.',
    en: 'ZIP code not found.',
    es: 'Código postal no encontrado.',
  },
  [ErrorCode.SHIPPING_AREA_NOT_COVERED]: {
    pt: 'Não entregamos nesta região.',
    en: 'We do not deliver to this area.',
    es: 'No entregamos en esta zona.',
  },
  [ErrorCode.SHIPPING_QUOTE_FAILED]: {
    pt: 'Falha ao calcular frete. Tente novamente.',
    en: 'Failed to calculate shipping. Please try again.',
    es: 'Error al calcular el envío. Inténtelo de nuevo.',
  },
  [ErrorCode.SHIPPING_CARRIER_UNAVAILABLE]: {
    pt: 'Transportadora indisponível no momento.',
    en: 'Carrier unavailable at the moment.',
    es: 'Transportadora no disponible en este momento.',
  },
  [ErrorCode.SHIPPING_LABEL_GENERATION_FAILED]: {
    pt: 'Falha ao gerar etiqueta de envio.',
    en: 'Failed to generate shipping label.',
    es: 'Error al generar la etiqueta de envío.',
  },
  [ErrorCode.SHIPPING_TRACKING_UNAVAILABLE]: {
    pt: 'Rastreamento não disponível.',
    en: 'Tracking not available.',
    es: 'Seguimiento no disponible.',
  },
  [ErrorCode.DELIVERY_ASSIGNMENT_FAILED]: {
    pt: 'Falha ao atribuir entregador.',
    en: 'Failed to assign delivery driver.',
    es: 'Error al asignar repartidor.',
  },

  // Review
  [ErrorCode.REVIEW_NOT_FOUND]: {
    pt: 'Avaliação não encontrada.',
    en: 'Review not found.',
    es: 'Reseña no encontrada.',
  },
  [ErrorCode.REVIEW_ALREADY_EXISTS]: {
    pt: 'Você já avaliou este item.',
    en: 'You have already reviewed this item.',
    es: 'Ya ha reseñado este artículo.',
  },
  [ErrorCode.REVIEW_NOT_ELIGIBLE]: {
    pt: 'Você precisa comprar este produto para avaliá-lo.',
    en: 'You need to purchase this product to review it.',
    es: 'Necesita comprar este producto para reseñarlo.',
  },
  [ErrorCode.REVIEW_RATING_INVALID]: {
    pt: 'Avaliação deve ser entre 1 e 5 estrelas.',
    en: 'Rating must be between 1 and 5 stars.',
    es: 'La calificación debe ser entre 1 y 5 estrellas.',
  },
  [ErrorCode.REVIEW_CONTENT_INVALID]: {
    pt: 'Conteúdo da avaliação inválido.',
    en: 'Invalid review content.',
    es: 'Contenido de la reseña inválido.',
  },
  [ErrorCode.REVIEW_MEDIA_UPLOAD_FAILED]: {
    pt: 'Falha ao carregar mídia da avaliação.',
    en: 'Failed to upload review media.',
    es: 'Error al cargar los medios de la reseña.',
  },

  // Loyalty
  [ErrorCode.LOYALTY_NOT_ENABLED]: {
    pt: 'Programa de fidelidade não está ativo.',
    en: 'Loyalty program is not active.',
    es: 'El programa de fidelidad no está activo.',
  },
  [ErrorCode.LOYALTY_INSUFFICIENT_POINTS]: {
    pt: 'Pontos insuficientes.',
    en: 'Insufficient points.',
    es: 'Puntos insuficientes.',
  },
  [ErrorCode.LOYALTY_CASHBACK_UNAVAILABLE]: {
    pt: 'Cashback não disponível.',
    en: 'Cashback not available.',
    es: 'Cashback no disponible.',
  },
  [ErrorCode.LOYALTY_REWARD_NOT_FOUND]: {
    pt: 'Recompensa não encontrada.',
    en: 'Reward not found.',
    es: 'Recompensa no encontrada.',
  },
  [ErrorCode.LOYALTY_REWARD_EXPIRED]: {
    pt: 'Esta recompensa expirou.',
    en: 'This reward has expired.',
    es: 'Esta recompensa ha expirado.',
  },

  // External
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    pt: 'Erro em serviço externo. Tente novamente.',
    en: 'External service error. Please try again.',
    es: 'Error en servicio externo. Inténtelo de nuevo.',
  },
  [ErrorCode.SUPABASE_ERROR]: {
    pt: 'Erro no banco de dados. Tente novamente.',
    en: 'Database error. Please try again.',
    es: 'Error en la base de datos. Inténtelo de nuevo.',
  },
  [ErrorCode.REDIS_ERROR]: {
    pt: 'Erro de cache. Tente novamente.',
    en: 'Cache error. Please try again.',
    es: 'Error de caché. Inténtelo de nuevo.',
  },
  [ErrorCode.PAYMENT_GATEWAY_TIMEOUT]: {
    pt: 'Tempo esgotado ao processar pagamento. Tente novamente.',
    en: 'Payment processing timed out. Please try again.',
    es: 'Se agotó el tiempo al procesar el pago. Inténtelo de nuevo.',
  },
  [ErrorCode.SHIPPING_API_ERROR]: {
    pt: 'Erro ao consultar frete. Tente novamente.',
    en: 'Error querying shipping. Please try again.',
    es: 'Error al consultar el envío. Inténtelo de nuevo.',
  },
  [ErrorCode.GEOCODING_ERROR]: {
    pt: 'Erro ao localizar endereço.',
    en: 'Error locating address.',
    es: 'Error al localizar la dirección.',
  },

  // File
  [ErrorCode.FILE_TOO_LARGE]: {
    pt: 'Arquivo muito grande. Tamanho máximo: 10MB.',
    en: 'File too large. Maximum size: 10MB.',
    es: 'Archivo demasiado grande. Tamaño máximo: 10MB.',
  },
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: {
    pt: 'Tipo de arquivo não permitido.',
    en: 'File type not allowed.',
    es: 'Tipo de archivo no permitido.',
  },
  [ErrorCode.FILE_UPLOAD_FAILED]: {
    pt: 'Falha ao enviar arquivo. Tente novamente.',
    en: 'File upload failed. Please try again.',
    es: 'Error al subir el archivo. Inténtelo de nuevo.',
  },
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: {
    pt: 'Limite de armazenamento excedido.',
    en: 'Storage quota exceeded.',
    es: 'Cuota de almacenamiento excedida.',
  },

  // Network
  [ErrorCode.NETWORK_ERROR]: {
    pt: 'Erro de conexão. Verifique sua internet e tente novamente.',
    en: 'Connection error. Check your internet and try again.',
    es: 'Error de conexión. Verifique su internet e inténtelo de nuevo.',
  },
  [ErrorCode.CONNECTION_TIMEOUT]: {
    pt: 'A operação demorou muito. Tente novamente.',
    en: 'Operation timed out. Please try again.',
    es: 'La operación tardó demasiado. Inténtelo de nuevo.',
  },
  [ErrorCode.NO_INTERNET]: {
    pt: 'Sem conexão com a internet. Verifique sua rede.',
    en: 'No internet connection. Check your network.',
    es: 'Sin conexión a internet. Verifique su red.',
  },
};

export const CategoryMessages: Record<ErrorCategory, LocalizedMessage> = {
  [ErrorCategory.NETWORK]: {
    pt: 'Erro de conexão. Verifique sua internet e tente novamente.',
    en: 'Connection error. Check your internet and try again.',
    es: 'Error de conexión. Verifique su internet e inténtelo de nuevo.',
  },
  [ErrorCategory.AUTH]: {
    pt: 'Erro de autenticação. Por favor, faça login novamente.',
    en: 'Authentication error. Please log in again.',
    es: 'Error de autenticación. Por favor, inicie sesión de nuevo.',
  },
  [ErrorCategory.AUTHORIZATION]: {
    pt: 'Você não tem permissão para esta ação.',
    en: 'You do not have permission for this action.',
    es: 'No tiene permiso para esta acción.',
  },
  [ErrorCategory.VALIDATION]: {
    pt: 'Dados inválidos. Verifique as informações e tente novamente.',
    en: 'Invalid data. Please check the information and try again.',
    es: 'Datos inválidos. Verifique la información e inténtelo de nuevo.',
  },
  [ErrorCategory.NOT_FOUND]: {
    pt: 'Recurso não encontrado.',
    en: 'Resource not found.',
    es: 'Recurso no encontrado.',
  },
  [ErrorCategory.CONFLICT]: {
    pt: 'Conflito de dados. Este registro já existe.',
    en: 'Data conflict. This record already exists.',
    es: 'Conflicto de datos. Este registro ya existe.',
  },
  [ErrorCategory.SERVER]: {
    pt: 'Erro no servidor. Tente novamente em alguns instantes.',
    en: 'Server error. Please try again in a few moments.',
    es: 'Error del servidor. Inténtelo de nuevo en unos momentos.',
  },
  [ErrorCategory.STORAGE]: {
    pt: 'Erro ao acessar dados. Tente novamente.',
    en: 'Error accessing data. Please try again.',
    es: 'Error al acceder a los datos. Inténtelo de nuevo.',
  },
  [ErrorCategory.PAYMENT]: {
    pt: 'Erro no processamento do pagamento. Tente novamente.',
    en: 'Payment processing error. Please try again.',
    es: 'Error en el procesamiento del pago. Inténtelo de nuevo.',
  },
  [ErrorCategory.SHIPPING]: {
    pt: 'Erro no cálculo de frete. Tente novamente.',
    en: 'Shipping calculation error. Please try again.',
    es: 'Error en el cálculo del envío. Inténtelo de nuevo.',
  },
  [ErrorCategory.EXTERNAL]: {
    pt: 'Erro em serviço externo. Tente novamente.',
    en: 'External service error. Please try again.',
    es: 'Error en servicio externo. Inténtelo de nuevo.',
  },
  [ErrorCategory.UNKNOWN]: {
    pt: 'Ocorreu um erro inesperado. Tente novamente.',
    en: 'An unexpected error occurred. Please try again.',
    es: 'Ocurrió un error inesperado. Inténtelo de nuevo.',
  },
};

export function getErrorMessage(code: ErrorCode, locale: Locale = 'pt'): string {
  const messages = ErrorMessages[code];
  return messages?.[locale] || ErrorMessages[ErrorCode.UNKNOWN_ERROR][locale];
}

export function getCategoryMessage(category: ErrorCategory, locale: Locale = 'pt'): string {
  return CategoryMessages[category]?.[locale] || CategoryMessages[ErrorCategory.UNKNOWN][locale];
}

export function getLocaleFromNavigator(): Locale {
  const browserLang = navigator.language?.split('-')[0];
  if (browserLang === 'pt' || browserLang === 'en' || browserLang === 'es') {
    return browserLang;
  }
  return 'pt';
}
