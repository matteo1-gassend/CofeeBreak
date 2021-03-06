import {useState} from "react"
import toast from "react-hot-toast";
import { useRecoilValue } from "recoil";
import payMethodsAtom from "../context/atoms/payMethods";
import { client, database } from "../utils/client";

export default function ChargesAdd({isOpen, setIsOpen, doc}) {
  const [value, setValue] = useState(0)
  const [inFunds, setInFunds] = useState(true)
  const [payment, setPayment] = useState(undefined)
  const payMethods = useRecoilValue(payMethodsAtom);


  const handleSubmit = async(e) => {
    e.preventDefault()
    const total = parseFloat(value) + parseFloat(doc.charges);
    try {
      console.log(doc)
      if (inFunds && !payment) {
        toast.error("please choose pay method");
        return;
      }
      await database.updateDocument(process.env.NEXT_PUBLIC_CREDIT_COLLECTION, doc["$id"], {email:  doc.email, charges: total});
      toast.success("charges updated")
      if (inFunds) {
          const latestFund = await database.listDocuments(process.env.NEXT_PUBLIC_FUND_COLLECTION, undefined, 1, undefined, undefined, undefined, ["date"], ["DESC"]);
          await database.createDocument(process.env.NEXT_PUBLIC_FUND_COLLECTION, "unique()", {amount: value * parseFloat(process.env.NEXT_PUBLIC_CHARGE_VALUE), reason: `${doc.email} recharge` || null, date: new Date().toISOString(), totalAmount: (latestFund.documents[0]?.totalAmount ?? 0) + (value * parseFloat(process.env.NEXT_PUBLIC_CHARGE_VALUE)), method: payment});
          toast.success("funds updated");
      }
      setValue(0)
      setInFunds(true)
      setPayment(undefined);
      setIsOpen(false);
    } catch (error) {
      console.error(error)
      toast.error("something went wrong")
    }
  }


  if (isOpen) {
    return (
      <div className=" w-full h-full absolute top-0 z-10">
        <div className="bg-black/70 w-full h-full flex flex-col justify-center items-center" onClick={() => setIsOpen(false)}>
          <div className="card bg-base-100 w-96 shadow-xl z-20" onClick={(e) => e.stopPropagation()}>
            <div className="card-body">
              <h2 className="card-title">Add / Remove funds</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-control">
                  <label className="label"><span className="label-text">Amount to recharge</span></label>
                  <input min={1} className="input input-bordered w-full max-w-xs" type="number" placeholder="Enter Amount" required value={value} onChange={(e) => setValue(e.target.value)}/>
                  <label htmlFor="funds">Add to funds ?</label>
                  <input name="funds" type="checkbox" checked={inFunds} onChange={() => setInFunds(!inFunds)} className="checkbox" />
                  {inFunds &&                   <select className="select select-bordered w-full max-w-x" defaultValue="none" required onChange={(e) => setPayment(e.target.value)}>
                    <option disabled value="none">Select payment method</option>
                    {payMethods.map((e) => <option key={e.$id} value={e.$id}>{e.name}</option>)}
                  </select>}
                </div>
                <div className="card-actions justify-end mt-3">
                  <button className="btn btn-error" onClick={() => {
                    setValue()
                    setIsOpen(false)
                  }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null;
}