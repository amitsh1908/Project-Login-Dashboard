import "./card.css"
import React from 'react'
const Card = ({ amount, img, checkoutHandler }) => {
    return (
    <div className="app">
      <div className="card">
        <img
          src={img} 
          alt="product"
          className="card-img"
        />
        <div className="card-content">
          <h2 className="price">{amount}</h2>
          <button className="pay-btn" onClick={()=> checkoutHandler(amount)}>Buy Now</button>
        </div>
      </div>
    </div>
  )
}
export default Card


