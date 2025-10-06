import React,{ useState } from "react";

import FAQ from "../comps/Faq";

export default function Footer() {
  const [showFAQ, setShowFAQ] = useState(false);
  return (
    <footer class="footer">
      <p>
        &copy; {new Date().getFullYear()} HelpDesk. All rights reserved. 🤓👆
      </p>
      <button onClick={() => setShowFAQ(true)} class="faq-btn">
        ❓ FAQ
      </button>

      <FAQ show={showFAQ} onClose={() => setShowFAQ(false)} />
    </footer>
  );
}
