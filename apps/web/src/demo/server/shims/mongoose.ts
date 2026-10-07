// `apps/api` imports `mongoose` for its types, which its decorators still name at run time, and for the base class
// of its schemas

export class Document {}
export const Model = Object
export const PaginateModel = Object
export const PaginateResult = Object
export const Connection = Object

const mongoose = { Schema: { Types: { Mixed: Object, ObjectId: String } }, Types: { ObjectId: String } }

export default mongoose
