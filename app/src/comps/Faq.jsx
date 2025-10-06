import React from "react";

export default function Faq({ show, onClose }) {
  if (!show) return null;

  return (
    <div class="faq-overlay">
      <div class="faq">
        <h2>Frequently Asked Questions 🤓</h2>
        <ul class="faq-li">
          <li>
            <strong>Q:</strong> How do I reset my password?
            <br />
            A: Why 
          </li>
          <li>
            <strong>Q:</strong> How do I contact support?
            <br />
            A: Are
          </li>
          <li>
            <strong>Q:</strong> Can I change my username?
            <br />
            A: You
          </li>
          <li>
            <strong>Q:</strong> Does this project stink?
            <br />
            A: Reading
          </li>
          <li>
            <strong>Q: ▶︎•၊၊||၊|။||||။၊|။•</strong> ?
            <br />
            A: These
          </li>
        </ul>

        <button onClick={onClose} class="close-btn">
          Close
        </button>
      </div>
    </div>
  );
}
