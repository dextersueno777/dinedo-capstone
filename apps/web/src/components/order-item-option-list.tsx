import type { OrderItem } from '@/lib/api-types';

function formatPrice(price: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(price));
}

type Props = {
  item: Pick<OrderItem, 'options' | 'specialNotes'>;
};

export function OrderItemOptionList({ item }: Props) {
  const options = item.options ?? [];

  return (
    <>
      {options.length > 0 ? (
        <ul className="cart-option-list">
          {options.map((option) => (
            <li key={option.id}>
              <span>
                {option.optionGroupName}: {option.optionName}
              </span>
              {Number(option.priceDelta) > 0 ? (
                <strong>+{formatPrice(option.priceDelta)}</strong>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {item.specialNotes ? (
        <p className="cart-special-notes">Note: {item.specialNotes}</p>
      ) : null}
    </>
  );
}
