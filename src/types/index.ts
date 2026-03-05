export interface Operador {
    id: string;
    nome: string;
    ativo: boolean;
}

export interface Maquina {
    id: string;
    nome: string;
    ativa: boolean;
}

export interface RegistroParada {
    id?: string;
    operador_id: string;
    maquina_id: string;
    turno: '1' | '2';
    tipo_parada: string;
    utilidades_foco?: string;
    descricao?: string;
    numero_nota?: string;
    inicio_parada: string;
    fim_parada?: string;
}

export interface ProducaoHora {
    id?: string;
    operador_id: string;
    maquina_id: string;
    turno: '1' | '2';
    data_referencia: string;
    hora_referencia: number;
    quantidade: number;
}
