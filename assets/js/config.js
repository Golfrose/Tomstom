// นี่คือฐานข้อมูลสินค้าของคุณ
// คุณสามารถเพิ่ม ลบ หรือแก้ไขรายการสินค้าได้จากไฟล์นี้ไฟล์เดียว
export const products = [
    // ================== หมวดน้ำ ==================
    {
        id: 'water_silver',
        name: 'น้ำผสมเงิน',
        price: 100,
        unit: 'ขวด',
        category: 'water',
        mixes: ['ผสมเงิน', 'ผสมเงินซี', 'ผสมเงินน้ำตาลสด']
    },
    {
        id: 'water_red',
        name: 'น้ำผสมแดง',
        price: 100,
        unit: 'ขวด',
        category: 'water',
        mixes: ['ผสมแดง', 'ผสมแดงซี', 'ผสมแดงน้ำตาลสด']
    },
    {
        id: 'water_chicken',
        name: 'น้ำผสมไก่',
        price: 100,
        unit: 'ขวด',
        category: 'water',
        mixes: ['ผสมไก่', 'ผสมไก่ซี', 'ผสมไก่น้ำตาลสด']
    },
    {
        id: 'water_raw',
        name: 'น้ำดิบ',
        price: 65,
        unit: 'ขวด (2 ขวด 120)', // คุณสามารถใส่ข้อความโปรโมชั่นตรงนี้ได้
        category: 'water',
        mixes: [] // สินค้าที่ไม่มีตัวเลือกย่อย ให้ใส่เป็น array ว่างไว้
    },
    {
        id: 'water_free',
        name: 'แลกขวดฟรี',
        price: 0,
        unit: 'ขวด',
        category: 'water',
        mixes: ['แลกฟรี', 'แลกฟรีผสมซี', 'แลกฟรีน้ำตาลสด']
    },
    // ================== หมวดยา ==================
    {
        id: 'med_silver',
        name: 'ยาฝาเงิน',
        price: 80,
        unit: 'ขวด',
        category: 'med',
        mixes: [] // สินค้าหมวดยาจะไม่มีตัวเลือกย่อย
    },
    {
        id: 'med_red',
        name: 'ยาฝาแดง',
        price: 90,
        unit: 'ขวด',
        category: 'med',
        mixes: []
    },
    {
        id: 'med_chicken',
        name: 'ยาไก่',
        price: 80,
        unit: 'ขวด',
        category: 'med',
        mixes: []
    },
    {
        id: 'med_zee',
        name: 'ยาซี',
        price: 80,
        unit: 'ขวด',
        category: 'med',
        mixes: []
    },
    // คุณสามารถเพิ่มสินค้ารายการใหม่ต่อจากตรงนี้ได้เลย
    // {
    //     id: 'new_product',
    //     name: 'สินค้าใหม่',
    //     price: 150,
    //     unit: 'ชิ้น',
    //     category: 'med',
    //     mixes: []
    // },
];
