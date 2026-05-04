import mongoose from "mongoose";

const { Schema } = mongoose;

const MetaDataSchema = new Schema(
  {
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: null },
    created_by_user_id: { type: Number, default: null },
    created_by_user_name: { type: String, default: null },
    updated_by_user_id: { type: Number, default: null },
    updated_by_user_name: { type: String, default: null },
    created_at_source: { type: String, default: null },
    updated_at_source: { type: String, default: null },
    total_size: { type: Number, default: 0 },
    created_at_coordinates: { type: Schema.Types.Mixed, default: null },
    updated_at_coordinates: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const SupplierSchema = new Schema(
  {
    coletumId: { type: String, required: true, unique: true, index: true },
    formId: { type: String, required: true, index: true },
    answer: { type: Schema.Types.Mixed, required: true },
    meta_data: { type: MetaDataSchema, required: true },
  },
  { timestamps: true, collection: "suppliers" }
);

SupplierSchema.index({ "meta_data.updated_at": -1 });
SupplierSchema.index({ "meta_data.created_at": -1 });

const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);

export default Supplier;
