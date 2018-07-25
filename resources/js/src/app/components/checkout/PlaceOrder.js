var ApiService = require("services/ApiService");
var NotificationService = require("services/NotificationService");

import TranslationService from "services/TranslationService";
import {navigateTo}from "services/UrlService";

Vue.component("place-order", {

    delimiters: ["${", "}"],

    props: [
        "targetContinue",
        "template"
    ],

    data()
    {
        return {
            waiting: false
        };
    },

    computed: Vuex.mapState({
        checkoutValidation: state => state.checkout.validation,
        contactWish: state => state.checkout.contactWish,
        isBasketLoading: state => state.basket.isBasketLoading,
        basketItemQuantity: state => state.basket.data.itemQuantity,
        isBasketInitiallyLoaded: state => state.basket.isBasketInitiallyLoaded,
        shippingPrivacyHintAccepted: state => state.checkout.shippingPrivacyHintAccepted
    }),

    created()
    {
        this.$options.template = this.template;
    },

    methods: {
        placeOrder()
        {
            this.waiting = true;

            const url = "/rest/io/order/additional_information";
            const params = {orderContactWish: this.contactWish, shippingPrivacyHintAccepted: this.shippingPrivacyHintAccepted};
            const options = {supressNotifications: true};

            ApiService.post(url, params, options)
                .always(() =>
                {
                    this.preparePayment();
                });
        },

        preparePayment()
        {
            this.waiting = true;

            if (this.validateCheckout() && this.basketItemQuantity > 0)
            {
                ApiService.post("/rest/io/checkout/payment")
                    .done(response =>
                    {
                        this.afterPreparePayment(response);
                    })
                    .fail(error =>
                    {
                        this.waiting = false;
                    });
            }
            else
            {
                NotificationService.error(
                    TranslationService.translate("Ceres::Template.checkoutCheckEntries")
                );
                this.waiting = false;
            }
        },

        validateCheckout()
        {
            let isValid = true;

            for (const index in this.checkoutValidation)
            {
                if (this.checkoutValidation[index].validate)
                {
                    this.checkoutValidation[index].validate();

                    if (this.checkoutValidation[index].showError)
                    {
                        isValid = !this.checkoutValidation[index].showError;
                    }
                }
            }

            return isValid;
        },

        afterPreparePayment(response)
        {
            var paymentType = response.type || "errorCode";
            var paymentValue = response.value || "";

            switch (paymentType)
            {
            case "continue":
                var target = this.targetContinue;

                if (target)
                {
                    navigateTo(target);
                }
                break;
            case "redirectUrl":
                    // redirect to given payment provider
                window.location.assign(paymentValue);
                break;
            case "externalContentUrl":
                    // show external content in iframe
                this.showModal(paymentValue, true);
                break;
            case "htmlContent":
                this.showModal(paymentValue, false);
                break;

            case "errorCode":
                NotificationService.error(paymentValue);
                this.waiting = false;
                break;
            default:
                NotificationService.error("Unknown response from payment provider: " + paymentType);
                this.waiting = false;
                break;
            }
        },

        showModal(content, isExternalContent)
        {
            if (isExternalContent)
            {
                this.$emit("payment-response", "<iframe src=\"" + content + "\">");
            }
            else
            {
                this.$emit("payment-response", content);
            }
        }
    }
});
