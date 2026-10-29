import test from 'node:test';
import assert from 'node:assert/strict';
import {applyTrust} from '../lib/product-trust.js';
import {normalizeProduct} from '../lib/catalog.js';
const external={1:0,2:0,3:0,4:1,5:20};
test('20 five-star + 1 four-star from outside website => 4.95',()=>{
 const p=applyTrust({id:'P1',displaySoldCount:1283,externalRatingCounts:external},new Map());
 assert.equal(p.reviewCount,21);assert.equal(p.ratingAverage,4.95);
 assert.equal(p.verifiedReviewCount,0);assert.equal(p.externalReviewCount,21);assert.equal(p.ratingKind,'combined');
});
test('add one verified four-star to off-site review counts => 4.91',()=>{
 const real=new Map([['P1',{soldCount:1,reviewCount:1,ratingAverage:4,ratingCounts:{1:0,2:0,3:0,4:1,5:0}}]]);
 const p=applyTrust({id:'P1',externalRatingCounts:external},real);
 assert.equal(p.reviewCount,22);assert.equal(p.ratingAverage,4.91);
 assert.equal(p.ratingCounts[4],2);assert.equal(p.ratingCounts[5],20);
 assert.equal(p.verifiedReviewCount,1);assert.equal(p.externalReviewCount,21);
});
test('source is no longer mandatory in product form',()=>{
 const p=normalizeProduct({id:'RATE01',name:'Hoa trang trí',slug:'hoa-trang-tri',category:'hoa-lua',price:150000,image:'https://example.com/a.jpg',active:true,externalRatingCounts:external});
 assert.equal(p.externalRatingSource,'');
});
