import sql from "../config/sql.mjs";
import { v4 as uuidv4 } from "uuid";

export const createOrder = (order) => {
  return new Promise((resolve, reject) => {
    const {
      id = uuidv4(),
      idUser,
      barang,
      metodePengiriman,
      metodePembayaran,
      idCard,
      promoCode,
      status = "pending",
    } = order;

    let subTotal = barang.reduce((total, item) => {
      return total + item.quantity * item.ItemPrice;
    }, 0);
    subTotal *= 1000;

    // TABEL ORDERS
    const query = `INSERT INTO orders (id, idUser, metodePengiriman, metodePembayaran, idCard, promoCode, subTotal, statusOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let params = [
      id,
      idUser,
      metodePengiriman,
      metodePembayaran,
      idCard || null,
      promoCode || null,
      subTotal,
      status,
    ];

    if (metodePembayaran === "card") {
      const { firstname, lastname, cardNumber, cvv, month, year } = order.card;
      const id = uuidv4();

      const cekCard = `SELECT * FROM cardDetails WHERE cardNumber = ?`;
      sql
        .execute(cekCard, [idCard])
        .then((result) => {
          if (result[0].length === 0) {
            const queryCard = `INSERT INTO cardDetails (id, firstname, lastname, cardNumber, cvv, month, year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const paramsCard = [
              id,
              firstname,
              lastname,
              cardNumber,
              cvv,
              month,
              year,
            ];
            sql
              .execute(queryCard, [...paramsCard])
              .then((result) => console.log(result))
              .catch((err) => console.log(err));
          }
        })
        .catch((err) => console.log(err));
    }

    sql
      .execute(query, [...params])
      .then((result) => resolve({ id }))
      .catch((err) => reject(err));

    // TABEL ORDERDETAILS

    // binding sesuai jumlah barang (item)
    const placeHoldOrderDetail = Array.from(
      { length: barang.length },
      () => "(?, ?, ?, ?, ?)"
    ).join(", ");

    let params2;

    const query2 = `INSERT INTO orderDetails (id, idOrder, idBarang, kuantitas, totalHarga) VALUES ${placeHoldOrderDetail}`;

    if (barang.length > 1) {
      // Jika panjang idBarang lebih dari 1, gunakan map atau forEach untuk membuat params
      params2 = barang.map((item) => [
        uuidv4(),
        id,
        item.id,
        item.quantity,
        item.quantity * item.ItemPrice * 1000,
      ]);
    } else {
      // Jika panjang idBarang hanya 1, buat params seperti biasa
      params2 = [
        uuidv4(),
        id,
        barang[0].id, // Mengambil idBarang pertama jika panjangnya hanya 1
        barang[0].quantity,
        barang[0].quantity * barang[0].ItemPrice * 1000,
      ];
    }

    const flattenedValues = params2.flat();

    sql
      .execute(query2, [...flattenedValues])
      .then((result) => console.log(result))
      .catch((err) => console.log(err));

    // return resolve(flattenedValues);
  });
};

// BELUM FINISH
export const getOrderByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT orders.id, orders.metodePengiriman, orders.metodePembayaran, orders.idCard, orders.promoCode, orders.subTotal, orders.statusOrder,
      orderDetails.idBarang, orderDetails.kuantitas, orderDetails.totalHarga
      FROM orders
      JOIN orderDetails ON orders.id = orderDetails.idOrder
      WHERE orders.idUser = ?
    `;

    sql
      .execute(query, [userId])
      .then((result) => {
        resolve(result[0]); // Assuming result is an array of orders
      })
      .catch((error) => {
        console.error("Error fetching orders by user ID:", error);
        reject(error);
      });
  });
};
