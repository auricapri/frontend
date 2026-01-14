export interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep?: string;
  numero?: string;
  complemento?: string;
  erro?: boolean;
}

