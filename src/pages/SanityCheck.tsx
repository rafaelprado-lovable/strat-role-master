import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ServiceStatus {
  name: string;
  value: string;
  status: 'ok' | 'error';
}

const responseTimeData: ServiceStatus[] = [
  { name: 'GFA_N_AttendanceAction', value: '10419335ms', status: 'error' },
  { name: 'MRSBL_R_Domain', value: '9048ms', status: 'error' },
  { name: 'ORCH_Create_CustAndProtocol', value: '5018ms', status: 'error' },
  { name: 'OrchCreateSiebelPosOrder', value: '10846ms', status: 'error' },
];

const availabilityData: ServiceStatus[] = [
  { name: 'AIRVANTAGE_A_SpecialCredit', value: '100%', status: 'ok' },
  { name: 'AIRVANTAGE_N_SMSAtivation', value: '99%', status: 'ok' },
  { name: 'AIRVANTAGE_R_ConsultSpecial', value: '99%', status: 'ok' },
  { name: 'BSCSIX_Create_Arrang_Assign', value: '99%', status: 'ok' },
  { name: 'BSCSIX_Create_Bill_Account', value: '100%', status: 'ok' },
  { name: 'BSCSIX_Create_Customer', value: '100%', status: 'ok' },
  { name: 'BSCSIX_R_AddressType', value: '100%', status: 'ok' },
  { name: 'BSCSIX_U_AddressType', value: '96%', status: 'ok' },
  { name: 'BSCSRSimcardData', value: '100%', status: 'ok' },
  { name: 'BSCSUServiceChange', value: '100%', status: 'ok' },
  { name: 'BSCS_R_BillingAccount', value: '100%', status: 'ok' },
  { name: 'BSCS_R_CorpCustomerInfo', value: '98%', status: 'ok' },
  { name: 'BSCS_R_RoiCustomization', value: '100%', status: 'ok' },
  { name: 'BSCS_R_SimCardDataInBSCS6', value: '100%', status: 'ok' },
  { name: 'BscsRCustomer', value: '100%', status: 'ok' },
  { name: 'CBCF_C_Fidelity', value: '100%', status: 'ok' },
  { name: 'CBD_R_Msisdn', value: '99%', status: 'ok' },
  { name: 'CRIVORCustomerEligibility', value: '100%', status: 'ok' },
  { name: 'CRIVO_C_ScoreElegibility', value: '100%', status: 'ok' },
  { name: 'ECMRBarCode', value: '100%', status: 'ok' },
  { name: 'ECMRClientSvcDataDetailPos', value: '100%', status: 'ok' },
  { name: 'ECMRInvoiceLines', value: '100%', status: 'ok' },
  { name: 'ECM_S_MailSecondBill', value: '100%', status: 'ok' },
  { name: 'EPCRProductCode', value: '99%', status: 'ok' },
  { name: 'EcmRCorporateInvoiceDetail', value: '100%', status: 'ok' },
  { name: 'F_BPM_QYRCGDTL', value: '81%', status: 'error' },
  { name: 'F_CR_INTPTC_GRPPRO', value: '100%', status: 'ok' },
  { name: 'F_NT_SODSTS_SIEBEL', value: '93%', status: 'ok' },
  { name: 'GEMFIRE_R_OnlineInvoices', value: '100%', status: 'ok' },
  { name: 'GEMSRDataPrePaid', value: '99%', status: 'ok' },
  { name: 'GEMS_R_InvoiceReport', value: '100%', status: 'ok' },
  { name: 'GFA_N_AttendanceAction', value: '100%', status: 'ok' },
  { name: 'GFA_N_NextPassword', value: '98%', status: 'ok' },
  { name: 'GemfireCInteraction', value: '100%', status: 'ok' },
  { name: 'GemfireUInteraction', value: '100%', status: 'ok' },
  { name: 'Gemfire_R_Interaction_MsisdnDoc', value: '100%', status: 'ok' },
  { name: 'HPERM_N_OfferActivate', value: '100%', status: 'ok' },
  { name: 'HRD_M_TimChipAllocation', value: '100%', status: 'ok' },
  { name: 'HpermCCustomer', value: '100%', status: 'ok' },
  { name: 'IMDBRProductCompatible', value: '100%', status: 'ok' },
  { name: 'IMDBRProductInformation', value: '100%', status: 'ok' },
  { name: 'IMDBRProfileFull', value: '100%', status: 'ok' },
  { name: 'IMDB_R_BillProfileRespPayId', value: '100%', status: 'ok' },
  { name: 'IMDB_R_ConsumptionProfile', value: '87%', status: 'error' },
  { name: 'IMDB_R_ContractServices', value: '100%', status: 'ok' },
  { name: 'IMDB_R_ContractsPlan', value: '100%', status: 'ok' },
  { name: 'IMDB_R_CustConventionInfo', value: '100%', status: 'ok' },
  { name: 'IMDB_R_CustomerAccess', value: '100%', status: 'ok' },
  { name: 'IMDB_R_CustomerCadauto', value: '100%', status: 'ok' },
  { name: 'IMDB_R_CustomerIdByMsisdn', value: '100%', status: 'ok' },
  { name: 'IMDB_R_CustomerPlan', value: '100%', status: 'ok' },
  { name: 'IMDB_R_CustomerProperties', value: '94%', status: 'ok' },
  { name: 'IMDB_R_Document', value: '100%', status: 'ok' },
  { name: 'IMDB_R_EligibDataPackage', value: '98%', status: 'ok' },
  { name: 'IMDB_R_EligibilityOCS', value: '100%', status: 'ok' },
  { name: 'IMDB_R_LastCustomerUpdate', value: '99%', status: 'ok' },
  { name: 'IMDB_R_MsisdnPlan', value: '100%', status: 'ok' },
  { name: 'IMDB_R_MultipleRegions', value: '100%', status: 'ok' },
  { name: 'IMDB_R_OngoingRequests', value: '100%', status: 'ok' },
  { name: 'IMDB_R_PlanStatusDocument', value: '100%', status: 'ok' },
  { name: 'IMDB_R_PlansServicesScore', value: '100%', status: 'ok' },
  { name: 'IMDB_R_ProfileMinimum', value: '99%', status: 'ok' },
  { name: 'IMDB_R_ProfileSvcContracts', value: '100%', status: 'ok' },
  { name: 'IMDB_R_ScoreCrivoTemp', value: '100%', status: 'ok' },
  { name: 'IMDB_R_ServsActByClient', value: '100%', status: 'ok' },
  { name: 'IMDB_U_BillingProfile', value: '100%', status: 'ok' },
  { name: 'IMDB_U_ContractProfile', value: '100%', status: 'ok' },
  { name: 'IMDB_U_CustomerProfile', value: '100%', status: 'ok' },
  { name: 'ImdbREligibleProductsFull', value: '100%', status: 'ok' },
  { name: 'JUVO_A_SpecialCredit', value: '98%', status: 'ok' },
  { name: 'JUVO_N_SpecialCredit', value: '100%', status: 'ok' },
  { name: 'JUVO_R_SpecialCredit', value: '100%', status: 'ok' },
  { name: 'MDG_S_Message', value: '100%', status: 'ok' },
  { name: 'MRSBLRCEP', value: '100%', status: 'ok' },
  { name: 'MRSBL_C_EligibilityData', value: '100%', status: 'ok' },
  { name: 'MRSBL_R_Domain', value: '100%', status: 'ok' },
  { name: 'MRSBL_R_OrderInformation', value: '100%', status: 'ok' },
  { name: 'MRSBL_R_Orders_Status', value: '100%', status: 'ok' },
  { name: 'MRSBL_R_SalesOrder', value: '100%', status: 'ok' },
  { name: 'MRSBL_R_ScoreCrivoOff', value: '100%', status: 'ok' },
  { name: 'OCSRQuotaInformation', value: '98%', status: 'ok' },
  { name: 'OCS_A_SpecialCredit', value: '99%', status: 'ok' },
  { name: 'OCS_C_ConsultSubscribers', value: '100%', status: 'ok' },
  { name: 'OCS_M_ShareFreeUnits', value: '97%', status: 'ok' },
  { name: 'OCS_R_CustomerInformation', value: '100%', status: 'ok' },
  { name: 'OCS_R_QueryFreeUnit', value: '100%', status: 'ok' },
  { name: 'OCS_R_QueryLastRecharge', value: '100%', status: 'ok' },
  { name: 'OCS_R_QueryRscRelation', value: '99%', status: 'ok' },
  { name: 'OMS_R_CatalogTranslation', value: '100%', status: 'ok' },
  { name: 'ORCHCMSEBITInformation', value: '100%', status: 'ok' },
  { name: 'ORCHCProductInformation', value: '100%', status: 'ok' },
  { name: 'ORCHCoFairUsageEligibility', value: '100%', status: 'ok' },
  { name: 'ORCHCoRelianceRebindElig', value: '100%', status: 'ok' },
  { name: 'ORCHConsultCustCadauto', value: '100%', status: 'ok' },
  { name: 'ORCHConsultInvInfor', value: '100%', status: 'ok' },
  { name: 'ORCHConsultQuotaInformation', value: '100%', status: 'ok' },
  { name: 'ORCH_C_ServicesActiveScore', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_DataPkgEleg', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_DataPkgPosEleg', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_EligibilOffer', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_LastCustUpdt', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_MultipRegions', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_OrderDataValid', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_PDVInfo', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_Quotas', value: '100%', status: 'ok' },
  { name: 'ORCH_Consult_SpecialCredit', value: '100%', status: 'ok' },
  { name: 'ORCH_Create_CustAndProtocol', value: '100%', status: 'ok' },
  { name: 'ORCH_Create_InteractionList', value: '100%', status: 'ok' },
  { name: 'ORCH_Create_PrePaidCustAut', value: '100%', status: 'ok' },
  { name: 'ORCH_Create_Reliance', value: '100%', status: 'ok' },
  { name: 'ORCH_M_RecogChipAndCkStrStk', value: '100%', status: 'ok' },
  { name: 'ORCH_Manage_ActCustomerLine', value: '100%', status: 'ok' },
  { name: 'ORCH_Manage_Interaction', value: '100%', status: 'ok' },
  { name: 'ORCH_Manage_QuizOnline', value: '100%', status: 'ok' },
  { name: 'ORCH_Manage_Resource', value: '100%', status: 'ok' },
  { name: 'ORCH_Manage_SpecialCredit', value: '100%', status: 'ok' },
  { name: 'ORCH_Manage_TimChip', value: '100%', status: 'ok' },
  { name: 'ORCH_Notify_Attendance', value: '100%', status: 'ok' },
  { name: 'ORCH_Notify_AttendanceAct', value: '100%', status: 'ok' },
  { name: 'ORCH_Notify_Outbound', value: '100%', status: 'ok' },
  { name: 'ORCH_Send_MailSecondBill', value: '100%', status: 'ok' },
  { name: 'ORCH_Update_DataPkgEleg', value: '100%', status: 'ok' },
  { name: 'ORCH_Update_DataPkgPosEleg', value: '100%', status: 'ok' },
  { name: 'ORCH_Update_InformationProf', value: '100%', status: 'ok' },
  { name: 'ORCH_Update_Interaction', value: '100%', status: 'ok' },
  { name: 'ORCH_Update_NotifyAndSMS', value: '100%', status: 'ok' },
  { name: 'ORCH_Update_QuotaGroup', value: '100%', status: 'ok' },
  { name: 'OrchCBillPFullByCustCode', value: '100%', status: 'ok' },
  { name: 'OrchConsultCustomerDataPlan', value: '100%', status: 'ok' },
  { name: 'OrchCreateSiebelPosOrder', value: '100%', status: 'ok' },
  { name: 'OrchUpdateServiceProduct', value: '100%', status: 'ok' },
  { name: 'Orch_C_BillProfileElegibility', value: '100%', status: 'ok' },
  { name: 'Orch_Consult_CustomerCrivo', value: '100%', status: 'ok' },
  { name: 'Orch_Consult_ProfileFull', value: '100%', status: 'ok' },
  { name: 'Orch_Consult_ProfileMinimum', value: '100%', status: 'ok' },
  { name: 'Orch_Manage_VoiceSvcLTE', value: '100%', status: 'ok' },
  { name: 'P2K_R_ConsultStock', value: '100%', status: 'ok' },
  { name: 'PFERBalanceLastRecharge', value: '100%', status: 'ok' },
  { name: 'PFERCurrentBalance', value: '100%', status: 'ok' },
  { name: 'PFERMSEBITInformation', value: '100%', status: 'ok' },
  { name: 'PFERPrePaidBalance', value: '99%', status: 'ok' },
  { name: 'PFEUMSEService', value: '99%', status: 'ok' },
  { name: 'PFE_R_ConcessionCredit', value: '100%', status: 'ok' },
  { name: 'PFE_R_ConsultSpecialCreditE', value: '99%', status: 'ok' },
  { name: 'PFE_U_BitService', value: '98%', status: 'ok' },
  { name: 'PFE_U_MarkMsisdnMSE', value: '100%', status: 'ok' },
  { name: 'PGU_R_AuthorizationVendor', value: '100%', status: 'ok' },
  { name: 'PGU_R_PDVInfo', value: '100%', status: 'ok' },
  { name: 'PMID_R_AccessInformation', value: '100%', status: 'ok' },
  { name: 'PROTOCOLONInteractionUpdate', value: '100%', status: 'ok' },
  { name: 'RMCARCustomerByCustCode', value: '100%', status: 'ok' },
  { name: 'RMCA_C_ListBlockedInvoices', value: '100%', status: 'ok' },
  { name: 'RMCA_R_BlockingOpenInvoices', value: '100%', status: 'ok' },
  { name: 'RMCA_R_Invoices', value: '100%', status: 'ok' },
  { name: 'RTDM_N_Interaction', value: '100%', status: 'ok' },
  { name: 'RTDM_N_Interaction_Async', value: '100%', status: 'ok' },
  { name: 'RTDM_R_EligibilityOffer', value: '99%', status: 'ok' },
  { name: 'RabbitMQNOfferActSuccess', value: '100%', status: 'ok' },
  { name: 'RabbitMQ_C_ServiceRequest', value: '100%', status: 'ok' },
  { name: 'RabbitMQ_U_ActivitySR', value: '100%', status: 'ok' },
  { name: 'RulesCErrorMessages', value: '100%', status: 'ok' },
  { name: 'RulesCPendingRequest', value: '100%', status: 'ok' },
  { name: 'RulesERecontratacao', value: '100%', status: 'ok' },
  { name: 'RulesEReducao', value: '100%', status: 'ok' },
  { name: 'RulesEReligaConfianca', value: '100%', status: 'ok' },
  { name: 'RulesEUpsell', value: '100%', status: 'ok' },
  { name: 'Rules_C_BancosConveniados', value: '100%', status: 'ok' },
  { name: 'Rules_C_DataVencimento', value: '100%', status: 'ok' },
  { name: 'Rules_C_FormaPagamento', value: '100%', status: 'ok' },
  { name: 'Rules_C_TipoConta', value: '100%', status: 'ok' },
  { name: 'Rules_Check_ABRT_Status', value: '100%', status: 'ok' },
  { name: 'Rules_Check_ChipAndDDD', value: '100%', status: 'ok' },
  { name: 'Rules_Check_FieldValidation', value: '100%', status: 'ok' },
  { name: 'Rules_Check_PrimaryOffering', value: '100%', status: 'ok' },
  { name: 'Rules_Check_State', value: '100%', status: 'ok' },
  { name: 'Rules_Consult_AreaId', value: '100%', status: 'ok' },
  { name: 'Rules_Consult_BillCycle', value: '100%', status: 'ok' },
  { name: 'Rules_Consult_InterType', value: '100%', status: 'ok' },
  { name: 'Rules_Consult_LastCustUpdt', value: '100%', status: 'ok' },
  { name: 'Rules_Consult_OfferDesc', value: '100%', status: 'ok' },
  { name: 'Rules_Consult_PlanOffer', value: '100%', status: 'ok' },
  { name: 'Rules_Consult_Reason', value: '100%', status: 'ok' },
  { name: 'Rules_E_DataVencimento', value: '100%', status: 'ok' },
  { name: 'Rules_E_FormaPagamento', value: '100%', status: 'ok' },
  { name: 'Rules_E_TipoConta', value: '100%', status: 'ok' },
  { name: 'Rules_Elegivel_BilletSales', value: '100%', status: 'ok' },
  { name: 'Rules_Elegivel_CtrlFatura', value: '100%', status: 'ok' },
  { name: 'Rules_Elegivel_CustCadauto', value: '100%', status: 'ok' },
  { name: 'Rules_Elegivel_SubType', value: '100%', status: 'ok' },
  { name: 'SENHAUNICA_N_PrePaid', value: '99%', status: 'ok' },
  { name: 'SGG_R_Group', value: '99%', status: 'ok' },
  { name: 'SGG_R_Master', value: '99%', status: 'ok' },
  { name: 'SGRRBankSlipBarCode', value: '51%', status: 'error' },
  { name: 'SIEBELCAT_R_CacheCheckEligi', value: '100%', status: 'ok' },
  { name: 'SIEBELCAT_U_CacheCheckEligi', value: '100%', status: 'ok' },
  { name: 'SIEBELPOSNCustRegData', value: '100%', status: 'ok' },
  { name: 'SIEBELPOS_M_ChipChangeOrder', value: '100%', status: 'ok' },
  { name: 'SIEBELPOS_N_OrderingStatus', value: '99%', status: 'ok' },
  { name: 'SIEBELPRE_M_CustInformation', value: '100%', status: 'ok' },
  { name: 'SIEBELPRE_N_ActivationQuiz', value: '100%', status: 'ok' },
  { name: 'SIEBELPRE_N_EventPrepaid', value: '99%', status: 'ok' },
  { name: 'SIEBEL_C_Access', value: '100%', status: 'ok' },
  { name: 'S_QY_DUNINT_SBLPOS', value: '100%', status: 'ok' },
  { name: 'SiebelPosCServiceRequest', value: '100%', status: 'ok' },
  { name: 'UCMRErrorNotify', value: '100%', status: 'ok' },
  { name: 'VASRCustomerPreferenceOptIn', value: '99%', status: 'ok' },
  { name: 'VASUCustomerPreferenceOptIn', value: '100%', status: 'ok' },
  { name: 'VAS_R_CustomerPartner', value: '100%', status: 'ok' },
  { name: 'VAS_R_QuizMinimumCriteria', value: '100%', status: 'ok' },
  { name: 'VAS_R_SimCard', value: '100%', status: 'ok' },
  { name: 'VAS_R_ValidateQuizProvider', value: '97%', status: 'ok' },
  { name: 'VAS_S_SalesOrder', value: '100%', status: 'ok' },
];

const SanityCheck = () => {
  const [lastUpdate] = useState(new Date());
  
  const responseTimeErrors = responseTimeData.filter(s => s.status === 'error');
  const availabilityErrors = availabilityData.filter(s => s.status === 'error');
  const totalErrors = responseTimeErrors.length + availabilityErrors.length;
  const totalServices = responseTimeData.length + availabilityData.length;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' - ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const ServiceRow = ({ service, type }: { service: ServiceStatus; type: 'response' | 'availability' }) => (
    <div 
      className={`flex items-center justify-between px-4 py-2 rounded-md transition-colors ${
        service.status === 'error' 
          ? 'bg-destructive/10 border border-destructive/30' 
          : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-3">
        {service.status === 'error' ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        )}
        <span className={`font-mono text-sm ${service.status === 'error' ? 'text-destructive font-medium' : 'text-foreground'}`}>
          {service.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant={service.status === 'error' ? 'destructive' : 'secondary'}
          className={service.status === 'ok' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : ''}
        >
          {service.value}
        </Badge>
        <span className="text-lg">
          {service.status === 'error' ? '❌' : '✅'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sanity Check</h1>
          <p className="text-muted-foreground">
            Monitoramento de disponibilidade e tempo de resposta dos serviços NMWS
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última atualização: {formatDate(lastUpdate)}</span>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      {totalErrors > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alertas Ativos</AlertTitle>
          <AlertDescription>
            {totalErrors} serviço{totalErrors > 1 ? 's' : ''} apresentando problemas. 
            Verifique os detalhes abaixo.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{totalServices}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Serviços OK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalServices - totalErrors}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas de Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">
                {responseTimeErrors.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas de Disponibilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">
                {availabilityErrors.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Tabs */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas ({totalErrors})
          </TabsTrigger>
          <TabsTrigger value="response" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tempo de Resposta
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Disponibilidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Serviços com Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalErrors === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                  <p>Todos os serviços estão operando normalmente!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {responseTimeErrors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Tempo de Resposta - {formatDate(lastUpdate)}
                      </h4>
                      <div className="space-y-1">
                        {responseTimeErrors.map((service) => (
                          <ServiceRow key={service.name} service={service} type="response" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {availabilityErrors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Disponibilidade - {formatDate(lastUpdate)}
                      </h4>
                      <div className="space-y-1">
                        {availabilityErrors.map((service) => (
                          <ServiceRow key={service.name} service={service} type="availability" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                SANITY NMWS DEFAULT - TEMPO DE RESPOSTA - {formatDate(lastUpdate)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {responseTimeData.map((service) => (
                    <ServiceRow key={service.name} service={service} type="response" />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                SANITY NMWS DEFAULT - DISPONIBILIDADE - {formatDate(lastUpdate)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-1">
                  {availabilityData.map((service) => (
                    <ServiceRow key={service.name} service={service} type="availability" />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SanityCheck;
