import { useEffect, useState } from "react";
import { getDefaultCurrency } from "../api/currencies";

const CurrencyDisplay = () => {
  const [currency, setCurrency] = useState(null);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const data = await getDefaultCurrency();
        setCurrency(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCurrency();
  }, []);

  if (!currency) return <div>Loading...</div>;
  return <div>Default currency: {currency.name}</div>;
};

export default CurrencyDisplay;
