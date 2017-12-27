import {List} from 'immutable'
import { Priority } from '../lib/Constants'
import { Route } from '../main'

export class Client {
  public name: string
  public url: string
  public interests: IInterests
  constructor( name: string, url: string, interests: IInterests) {
    this.name = name
    this.url = url
    this.interests = interests
  }
  public getRoutes() {
    const routes: List<Route> = List()
    return routes.withMutations((mutable) => {
      for (const key in this.interests) {
        if (this.interests.hasOwnProperty(key)) {
          const priority = this.interests[key] as Priority
          const route = new Route(this.name, key, this.url, priority)
          mutable.push(route)
        }
      }
    })
  }
}

export interface IInterests {
  [prop: string]: Priority
}

// export interface IInterests {
//   text?: Priority
//   image?: Priority
//   voice?: Priority
//   video?: Priority
//   shortvideo?: Priority
//   location?: Priority
//   link?: Priority
//   event?: IEventInterests
// }

// export interface IEventInterests {
//   default?: Priority
//   subscribe?: Priority
//   unsubscribe?: Priority
//   scan?: Priority
//   location?: Priority
//   /** Menu Event */
//   click?: Priority
//   view?: Priority
//   scancode_push?: Priority
//   scancode_waitmsg?: Priority
//   pic_sysphoto?: Priority
//   pic_photo_or_album?: Priority
//   pic_weixin?: Priority
//   location_select?: Priority
//   /** Mass Send Event */
//   masssendjobfinish?: Priority
//   /** Coupon Event */
//   card_pass_check?: Priority
//   user_get_card?: Priority
//   user_gifting_card?: Priority
//   user_del_card?: Priority
//   user_consume_card?: Priority
//   user_pay_from_pay_cell?: Priority
//   user_view_card?: Priority
//   user_enter_session_from_card?: Priority
//   update_member_card?: Priority
//   card_sku_remind?: Priority
//   card_pay_order?: Priority
//   submit_membercard_user_info?: Priority
//   /** Wifi Event */
//   wificonnected?: Priority
//   /** Product Scan */
//   user_scan_product?: Priority
//   // subscribe?: Priority // has different event key
//   user_scan_product_enter_session?: Priority
//   user_scan_product_async?: Priority
//   user_scan_product_verify_action?: Priority
// }

export default Client
