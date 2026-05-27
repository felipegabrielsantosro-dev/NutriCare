import { describe, it, expect } from 'vitest';
import { SellingPriceCalculator } from '../../app/view/pages/assets/components/SellingPriceCalculator.js';

describe('SellingPriceCalculator', () => {
    // create()
    describe('create()', () => {
        it('deve retornar uma instância de SellingPriceCalculator', () => {
            const calculator = SellingPriceCalculator.create();
            expect(calculator).toBeInstanceOf(SellingPriceCalculator);
        });
        it('cada chamada deve retornar uma instância nova e independente', () => {
            const a = SellingPriceCalculator.create();
            const b = SellingPriceCalculator.create();
            expect(a).not.toBe(b);
        });
    });
    // Testa o erro de – divisão por zero getData()
    describe('getData() – divisão por zero', () => {
        it('deve lançar um erro quando o divisor for igual a zero', () => {
            expect(() =>
                SellingPriceCalculator
                    .create()
                    .addPurchasePrice(0)
                    .addTotalTax(0)
                    .addProfitMargin(0)
                    .addOperatingCost(0)
                    .getData()

            ).toThrow('Preço de compra deve ser maior que zero. Recebido: 0');
        });
    });
    // Testa com valores válidos getData()
    describe('getData() – valores válidos', () => {
        it('deve calcular o preço de venda corretamente com valores válidos', () => {
            const result = SellingPriceCalculator
                .create()
                .addPurchasePrice(100)
                .addTotalTax(10)
                .addProfitMargin(20)
                .addOperatingCost(5)
                .getData();
            expect(result).toEqual({
                valor_venda_sugerido: 153.85,
                valor_total_imposto: 15.38,
                valor_margem_lucro: 30.78,
                valor_custo_operacional: 7.69,
            });
        });
    });
});