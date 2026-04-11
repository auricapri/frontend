/// ChangePaymentModal — Trocar meio de pagamento de pedido pendente

import { useState, useCallback, useMemo } from 'react';
import { Loader2, QrCode, Copy, Check, CreditCard, X, MapPin } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Order } from '../../types';
import { UserProfile } from '../../types/users/user';
import { PaymentMethod } from '../../constants/enums';
import { OrdersApi } from '../../api/orders.api';
import { PaymentsApi } from '../../api/payments.api';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';

type Step = 'choose' | 'address' | 'pix-form' | 'pix-qr' | 'card-form' | 'card-success' | 'error';

interface ChangePaymentModalProps {
  order: Order;
  currentUser: UserProfile;
  locale: Locale;
  onClose: () => void;
  onSuccess: () => void;
}

const ordersApi = new OrdersApi();
const paymentsApi = new PaymentsApi();

export function ChangePaymentModal({
  order,
  currentUser,
  locale,
  onClose,
  onSuccess,
}: ChangePaymentModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // PIX result
  const [pixQrImage, setPixQrImage] = useState('');
  const [pixQrPayload, setPixQrPayload] = useState('');
  const [pixExpiry, setPixExpiry] = useState('');

  // Customer data (from profile or manual input)
  const [cpf, setCpf] = useState(currentUser.cpf ?? '');
  const [phone, setPhone] = useState(currentUser.phone ?? '');

  // Address — pre-filled from order snapshot, editable
  const snapAddr = useMemo(() => {
    const snap = order.shipping_address_snapshot as any ?? {};
    return {
      logradouro: snap.logradouro ?? snap.street ?? '',
      numero: snap.numero ?? snap.number ?? '',
      complemento: snap.complemento ?? snap.complement ?? '',
      bairro: snap.bairro ?? snap.neighborhood ?? '',
      localidade: snap.localidade ?? snap.city ?? '',
      uf: snap.uf ?? snap.state ?? '',
      cep: snap.cep ?? snap.postalCode ?? '',
    };
  }, [order.shipping_address_snapshot]);

  const [logradouro, setLogradouro] = useState(snapAddr.logradouro);
  const [numero, setNumero] = useState(snapAddr.numero);
  const [complemento, setComplemento] = useState(snapAddr.complemento);
  const [bairro, setBairro] = useState(snapAddr.bairro);
  const [localidade, setLocalidade] = useState(snapAddr.localidade);
  const [uf, setUf] = useState(snapAddr.uf);
  const [cep, setCep] = useState(snapAddr.cep);

  // Credit card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(currentUser.full_name);
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const buildCustomerInfo = useCallback(() => ({
    name: currentUser.full_name,
    email: currentUser.email,
    cpfCnpj: cpf.replace(/\D/g, ''),
    phone: phone.replace(/\D/g, ''),
    postalCode: cep.replace(/\D/g, ''),
    addressNumber: numero,
    addressComplement: complemento,
  }), [currentUser, cpf, phone, cep, numero, complemento]);

  const handleSelectPix = useCallback(() => {
    setErrorMsg('');
    setSelectedMethod(PaymentMethod.PIX);
    setStep('address');
  }, []);

  const handleSelectCard = useCallback(() => {
    setErrorMsg('');
    setSelectedMethod(PaymentMethod.CREDIT_CARD);
    setStep('address');
  }, []);

  const handleConfirmAddress = useCallback(() => {
    if (!cep.replace(/\D/g, '')) { setErrorMsg('Informe o CEP'); return; }
    if (!numero.trim()) { setErrorMsg('Informe o número'); return; }
    setErrorMsg('');
    setStep(selectedMethod === PaymentMethod.PIX ? 'pix-form' : 'card-form');
  }, [cep, numero, selectedMethod]);

  const processPix = useCallback(async () => {
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanCpf.length < 11) {
      setErrorMsg('Informe um CPF válido');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMsg('Informe um telefone válido');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await ordersApi.changePaymentMethod(order.id, PaymentMethod.PIX);
      const result = await paymentsApi.processPayment({
        orderId: order.id,
        method: 'pix',
        customerInfo: buildCustomerInfo(),
      });
      setPixQrImage(result.qrCodeImage ?? '');
      setPixQrPayload(result.qrCodePayload ?? '');
      if (result.expiresAt) {
        setPixExpiry(new Date(result.expiresAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }));
      }
      setStep('pix-qr');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar pagamento');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }, [order.id, cpf, phone, buildCustomerInfo, locale]);

  const processCard = useCallback(async () => {
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanCpf.length < 11) { setErrorMsg('Informe o CPF'); return; }
    if (cleanPhone.length < 10) { setErrorMsg('Informe o telefone'); return; }
    if (cleanNumber.length < 15) { setErrorMsg('Número do cartão inválido'); return; }
    if (cardHolder.trim().length < 2) { setErrorMsg('Nome no cartão obrigatório'); return; }
    const [expiryMonth, expiryYear] = cardExpiry.split('/');
    if (!expiryMonth || !expiryYear) { setErrorMsg('Validade inválida (MM/AA)'); return; }
    if (cardCvv.length < 3) { setErrorMsg('CVV inválido'); return; }

    setLoading(true);
    setErrorMsg('');
    try {
      await ordersApi.changePaymentMethod(order.id, PaymentMethod.CREDIT_CARD);
      await paymentsApi.processPayment({
        orderId: order.id,
        method: 'credit_card',
        installments: 1,
        card: {
          number: cleanNumber,
          holderName: cardHolder.trim(),
          expiryMonth,
          expiryYear: expiryYear.length === 2 ? `20${expiryYear}` : expiryYear,
          cvv: cardCvv,
        },
        customerInfo: buildCustomerInfo(),
      });
      setStep('card-success');
      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Pagamento recusado');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }, [order.id, cpf, phone, cardNumber, cardHolder, cardExpiry, cardCvv, buildCustomerInfo, onSuccess]);

  const handleCopyPix = useCallback(async () => {
    await navigator.clipboard.writeText(pixQrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [pixQrPayload]);

  return (
    <Modal isOpen onClose={onClose} title="Trocar meio de pagamento">
      <div className="space-y-5">
        {/* Order summary */}
        <div className="flex justify-between items-center text-sm text-neutral-500 border-b border-neutral-100 pb-4">
          <span>Pedido #{order.id.slice(0, 8)}</span>
          <span className="font-semibold text-neutral-900">{formatCurrency(order.total, locale)}</span>
        </div>

        {/* STEP: choose */}
        {step === 'choose' && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">Escolha como deseja pagar:</p>
            <button
              onClick={handleSelectPix}
              className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-2xl hover:border-black hover:bg-neutral-50 transition-all text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <QrCode className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">PIX</p>
                <p className="text-xs text-neutral-400">Pagamento instantâneo</p>
              </div>
            </button>
            <button
              onClick={handleSelectCard}
              className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-2xl hover:border-black hover:bg-neutral-50 transition-all text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Cartão de crédito</p>
                <p className="text-xs text-neutral-400">1x sem juros ou parcelado</p>
              </div>
            </button>
          </div>
        )}

        {/* STEP: address */}
        {step === 'address' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span>Confirme o endereço de entrega:</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Logradouro"
                  value={logradouro}
                  onChange={e => setLogradouro(e.target.value)}
                  placeholder="Rua, Avenida..."
                />
              </div>
              <div>
                <Input
                  label="Número"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>
            <Input
              label="Complemento"
              value={complemento}
              onChange={e => setComplemento(e.target.value)}
              placeholder="Apto, Bloco... (opcional)"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Bairro"
                value={bairro}
                onChange={e => setBairro(e.target.value)}
                placeholder="Bairro"
              />
              <Input
                label="CEP"
                value={cep}
                onChange={e => setCep(e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2'))}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Cidade"
                  value={localidade}
                  onChange={e => setLocalidade(e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Input
                  label="UF"
                  value={uf}
                  onChange={e => setUf(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('choose'); setErrorMsg(''); }} className="flex-1">
                Voltar
              </Button>
              <Button variant="primary" onClick={handleConfirmAddress} className="flex-1">
                Confirmar e continuar
              </Button>
            </div>
          </div>
        )}

        {/* STEP: pix-form */}
        {step === 'pix-form' && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">Confirme seus dados para gerar o QR code:</p>
            <Input
              label="CPF"
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              placeholder="000.000.000-00"
            />
            <Input
              label="Telefone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('address'); setErrorMsg(''); }} className="flex-1">Voltar</Button>
              <Button variant="primary" onClick={processPix} isLoading={loading} className="flex-1">
                Gerar QR code
              </Button>
            </div>
          </div>
        )}

        {/* STEP: pix-qr */}
        {step === 'pix-qr' && (
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold text-green-600">QR code gerado!</p>
            {pixQrImage && (
              <img
                src={`data:image/png;base64,${pixQrImage}`}
                alt="QR code PIX"
                className="w-44 h-44 mx-auto border border-neutral-200 rounded-xl"
              />
            )}
            {pixExpiry && (
              <p className="text-xs text-neutral-400">Expira às {pixExpiry}</p>
            )}
            {pixQrPayload && (
              <button
                onClick={handleCopyPix}
                className="w-full flex items-center justify-center gap-2 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar código PIX'}
              </button>
            )}
            <p className="text-xs text-neutral-400">
              Após o pagamento, seu pedido será confirmado automaticamente.
            </p>
            <Button variant="primary" onClick={onClose} className="w-full">Fechar</Button>
          </div>
        )}

        {/* STEP: card-form */}
        {step === 'card-form' && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">Dados do cartão:</p>
            {(!currentUser.cpf || !currentUser.phone) && (
              <div className="space-y-3">
                {!currentUser.cpf && (
                  <Input label="CPF" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
                )}
                {!currentUser.phone && (
                  <Input label="Telefone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                )}
              </div>
            )}
            <Input
              label="Número do cartão"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
            />
            <Input
              label="Nome no cartão"
              value={cardHolder}
              onChange={e => setCardHolder(e.target.value)}
              placeholder="Como está no cartão"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Validade"
                  value={cardExpiry}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '');
                    setCardExpiry(v.length >= 2 ? `${v.slice(0, 2)}/${v.slice(2, 4)}` : v);
                  }}
                  placeholder="MM/AA"
                  maxLength={5}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="CVV"
                  value={cardCvv}
                  onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="000"
                  maxLength={4}
                />
              </div>
            </div>
            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('address'); setErrorMsg(''); }} className="flex-1">Voltar</Button>
              <Button variant="primary" onClick={processCard} isLoading={loading} className="flex-1">
                Pagar
              </Button>
            </div>
          </div>
        )}

        {/* STEP: error */}
        {step === 'error' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('choose')} className="flex-1">Tentar outro método</Button>
              <Button variant="outline" onClick={onClose} className="flex-1">Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
