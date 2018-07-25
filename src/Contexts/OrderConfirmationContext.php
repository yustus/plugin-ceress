<?php

namespace Ceres\Contexts;

use IO\Helper\ContextInterface;

class OrderConfirmationContext extends GlobalContext implements ContextInterface
{
    
    public $data;
    public $totals;
    public $showAdditionalPaymentInformation;
    
    public function init($params)
    {
        parent::init($params);
        
        $this->data = $params['data'];
        $this->totals = $params['totals'];
        $this->showAdditionalPaymentInformation = $params['showAdditionalPaymentInformation'];
    }
}