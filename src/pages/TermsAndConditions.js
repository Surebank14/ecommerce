import React from 'react';

const terms = [
  {
    title: 'Order Acceptance',
    body: 'Orders are confirmed after successful payment initialization and verification. SureBank may contact you to confirm delivery, pickup, or customer details before fulfilment.'
  },
  {
    title: 'Payment Processing',
    body: 'Outright payments are processed immediately through the payment gateway or wallet. Pay-small-small orders allow you to add money as you like from My Orders until the order balance is fully paid.'
  },
  {
    title: 'Product Payment Policy',
    body: "All transactions on this package are only for products or properties and are not to be withdrawn as cash. You can change the product you're paying for in pay-small-small from the varieties of products available in SureBank stores as your need arises."
  },
  {
    title: 'Item Delivery and Wallet Deduction',
    body: 'For pay-small-small orders with multiple items, deposited money remains in the customer wallet. When a specific item is marked delivered, the price of that item is deducted from the wallet if the wallet balance is sufficient.'
  },
  {
    title: 'Price Changes',
    body: 'Product prices may change based on changes in market price. If a product price changes before your order is fully paid, the unpaid order balance may be adjusted to reflect the current product price.'
  },
  {
    title: 'Out of Market Products',
    body: 'If a product becomes out of market before it is supplied, delivered, or picked up, you are required to replace it with another available product from SureBank stores. Payment may continue, but the out-of-market product cannot be supplied.'
  },
  {
    title: 'Delivery and Pickup',
    body: 'Products are available for pickup or delivery after the required payment has been confirmed for the item or order. For pickup, visit the selected SureBank location with a valid ID and order confirmation.'
  },
  {
    title: 'Product Returns',
    body: 'Products can be returned within 24 hours of delivery only if they are defective or damaged and were delivered by SureBank dispatch. Returns are not honored for pickup orders or when the customer uses their own dispatch. Items must be in their original packaging.'
  },
  {
    title: 'Withdrawal Requests',
    body: 'Withdrawal requests from your available balance will be reviewed and processed on or before 24 hours within working days.'
  },
  {
    title: 'Customer Responsibility',
    body: 'You are responsible for providing accurate delivery information and ensuring someone is available to receive the delivery at the specified address.'
  },
  {
    title: 'Changes to Terms',
    body: 'SureBank reserves the right to modify these terms at any time. Continued use of the ecommerce service constitutes acceptance of modified terms.'
  }
];

const TermsAndConditions = () => {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="mt-2 text-sm text-gray-600">
            These terms apply to purchases, wallet payments, pay-small-small orders, delivery, pickup, and product replacement on Sure-Bank Stores.
          </p>
        </div>

        <div className="space-y-4">
          {terms.map((term, index) => (
            <section key={term.title} className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {index + 1}. {term.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{term.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
